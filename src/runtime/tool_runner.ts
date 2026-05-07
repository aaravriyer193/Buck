// =============================================================================
// Buck — tool runner
// =============================================================================
// Each integration tool call is dispatched to a small JS adapter that runs
// inside the E2B sandbox. The adapter reads the relevant env vars (which the
// orchestrator injected at boot) and makes the actual HTTP call to the third
// party. We intentionally write these as inline scripts rather than packaged
// SDKs to keep the dependency surface small.
//
// In v1, since the runtime files are also being executed server-side (we run
// Buck from the orchestrator process for simplicity), the "sandbox" is more of
// a logical boundary. To upgrade to true sandboxing later, this file is the
// only thing that needs to change — everything else stays the same.
// =============================================================================

import { getCurrentSandbox } from './sandbox_context';

export async function runIntegrationTool(
  service: string,
  toolName: string,
  args: Record<string, unknown>,
  _sessionId: string
): Promise<unknown> {
  const sandbox = getCurrentSandbox();
  if (!sandbox) {
    throw new Error('No active sandbox for tool execution');
  }

  const adapter = ADAPTERS[service];
  if (!adapter) throw new Error(`No adapter for service: ${service}`);

  const handler = adapter[toolName];
  if (!handler) throw new Error(`Adapter for ${service} does not implement ${toolName}`);

  const code = handler(args);
  const exec = await sandbox.runCode(code, { language: 'js' });
  const stdout = exec.logs.stdout.join('').trim();
  const stderr = exec.logs.stderr.join('').trim();

  if (stderr && !stdout) {
    throw new Error(stderr);
  }
  try {
    return JSON.parse(stdout);
  } catch {
    return stdout;
  }
}

// ---------------------------------------------------------------------------
// Adapter registry
// ---------------------------------------------------------------------------

type Adapter = Record<string, (args: Record<string, unknown>) => string>;

const ADAPTERS: Record<string, Adapter> = {
  github: {
    'github.search_issues': (a) => fetchScript({
      url: `https://api.github.com/search/issues?q=${encodeURIComponentVar(a.q)}&per_page=${a.per_page ?? 20}`,
      headers: { Authorization: 'token ${process.env.GITHUB_PAT}', 'User-Agent': 'buck' },
    }),
    'github.get_issue': (a) => fetchScript({
      url: `https://api.github.com/repos/${a.owner}/${a.repo}/issues/${a.number}`,
      headers: { Authorization: 'token ${process.env.GITHUB_PAT}', 'User-Agent': 'buck' },
    }),
    'github.list_issue_comments': (a) => fetchScript({
      url: `https://api.github.com/repos/${a.owner}/${a.repo}/issues/${a.number}/comments`,
      headers: { Authorization: 'token ${process.env.GITHUB_PAT}', 'User-Agent': 'buck' },
    }),
    'github.create_issue_comment': (a) => fetchScript({
      url: `https://api.github.com/repos/${a.owner}/${a.repo}/issues/${a.number}/comments`,
      method: 'POST',
      headers: { Authorization: 'token ${process.env.GITHUB_PAT}', 'User-Agent': 'buck', 'Content-Type': 'application/json' },
      body: { body: a.body },
    }),
    'github.get_file': (a) => fetchScript({
      url: `https://api.github.com/repos/${a.owner}/${a.repo}/contents/${a.path}${a.ref ? `?ref=${a.ref}` : ''}`,
      headers: { Authorization: 'token ${process.env.GITHUB_PAT}', 'User-Agent': 'buck' },
    }),
  },

  slack: {
    'slack.list_channels': (a) => fetchScript({
      url: `https://slack.com/api/conversations.list?types=${a.types ?? 'public_channel,private_channel'}`,
      headers: { Authorization: 'Bearer ${process.env.SLACK_BOT_TOKEN}' },
    }),
    'slack.history': (a) => fetchScript({
      url: `https://slack.com/api/conversations.history?channel=${a.channel}&limit=${a.limit ?? 50}`,
      headers: { Authorization: 'Bearer ${process.env.SLACK_BOT_TOKEN}' },
    }),
    'slack.post_message': (a) => fetchScript({
      url: 'https://slack.com/api/chat.postMessage',
      method: 'POST',
      headers: { Authorization: 'Bearer ${process.env.SLACK_BOT_TOKEN}', 'Content-Type': 'application/json' },
      body: { channel: a.channel, text: a.text, thread_ts: a.thread_ts },
    }),
    'slack.search': (a) => fetchScript({
      url: `https://slack.com/api/search.messages?query=${encodeURIComponentVar(a.query)}&count=${a.count ?? 20}`,
      headers: { Authorization: 'Bearer ${process.env.SLACK_BOT_TOKEN}' },
    }),
  },

  // For services whose APIs require OAuth refresh-token flows or complex
  // payloads, we ship a richer adapter. The minimum-viable version below is a
  // placeholder that surfaces a clear error so Buck reports it in the diary.
  // TODO(buck): full adapter implementations for gmail, gdrive, gcal, notion,
  // linear, airtable, resend, firecrawl. They follow the same pattern as
  // github/slack above.
  gmail: stubAdapter('gmail'),
  'google-drive': stubAdapter('google-drive'),
  'google-calendar': stubAdapter('google-calendar'),
  notion: stubAdapter('notion'),
  linear: stubAdapter('linear'),
  airtable: stubAdapter('airtable'),
  resend: {
    'resend.send': (a) => fetchScript({
      url: 'https://api.resend.com/emails',
      method: 'POST',
      headers: { Authorization: 'Bearer ${process.env.RESEND_API_KEY}', 'Content-Type': 'application/json' },
      body: { from: '${process.env.RESEND_FROM}', to: a.to, subject: a.subject, html: a.html, text: a.text },
    }),
  },
  firecrawl: {
    'firecrawl.scrape': (a) => fetchScript({
      url: 'https://api.firecrawl.dev/v1/scrape',
      method: 'POST',
      headers: { Authorization: 'Bearer ${process.env.FIRECRAWL_API_KEY}', 'Content-Type': 'application/json' },
      body: { url: a.url, onlyMainContent: a.only_main_content ?? true },
    }),
    'firecrawl.search': (a) => fetchScript({
      url: 'https://api.firecrawl.dev/v1/search',
      method: 'POST',
      headers: { Authorization: 'Bearer ${process.env.FIRECRAWL_API_KEY}', 'Content-Type': 'application/json' },
      body: { query: a.query, limit: a.limit ?? 10, scrapeOptions: a.fetch_content ? { formats: ['markdown'] } : undefined },
    }),
  },
};

function stubAdapter(name: string): Adapter {
  return new Proxy({} as Adapter, {
    get(_t, tool) {
      return (_args: Record<string, unknown>) =>
        `console.log(JSON.stringify({error: "${name}_adapter_not_implemented", tool: "${String(tool)}"}));`;
    },
  });
}

interface FetchScriptOpts {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
}

/**
 * Build a JS snippet that runs in the sandbox and prints the response as JSON.
 * Header values that reference `${process.env.X}` are interpolated at sandbox
 * runtime, not here.
 */
function fetchScript(opts: FetchScriptOpts): string {
  const headersJson = JSON.stringify(opts.headers ?? {})
    .replace(/"\$\{process\.env\.([A-Z0-9_]+)\}"/g, 'process.env.$1');
  const bodyJson = opts.body !== undefined ? JSON.stringify(opts.body) : 'null';
  return `
(async () => {
  try {
    const headers = ${headersJson};
    const r = await fetch(${JSON.stringify(opts.url)}, {
      method: ${JSON.stringify(opts.method ?? 'GET')},
      headers,
      body: ${bodyJson === 'null' ? 'undefined' : `JSON.stringify(${bodyJson})`}
    });
    const text = await r.text();
    let parsed;
    try { parsed = JSON.parse(text); } catch { parsed = text; }
    console.log(JSON.stringify({ ok: r.ok, status: r.status, body: parsed }));
  } catch (e) {
    console.log(JSON.stringify({ ok: false, error: String(e && e.message || e) }));
  }
})();
`;
}

function encodeURIComponentVar(v: unknown): string {
  return `\${encodeURIComponent(${JSON.stringify(v)})}`;
}
