// =============================================================================
// Buck — tool runner
// =============================================================================
// Each integration tool call is dispatched to a small adapter. There are two
// adapter shapes:
//
//   1. String-returning — adapter returns JS code as a string, we execute it
//      inside the sandbox via runCode. Used for HTTP-based integrations like
//      github, slack, etc. that talk to external APIs.
//
//   2. Promise-returning — adapter is itself an async function that returns
//      the result directly. Used for `sandbox.*` tools that operate on the
//      sandbox itself rather than calling an HTTP API.
// =============================================================================

import { getCurrentSandbox } from './sandbox_context';

type AdapterFn =
  | ((args: Record<string, unknown>) => string)
  | ((args: Record<string, unknown>) => Promise<unknown>);

type Adapter = Record<string, AdapterFn>;

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

  const out = handler(args);

  // Promise-returning adapter (sandbox.*) — return the result directly.
  if (out && typeof out === 'object' && 'then' in (out as object)) {
    const resolved = await (out as Promise<unknown>);
    if (typeof resolved === 'string') {
      try { return JSON.parse(resolved); } catch { return resolved; }
    }
    return resolved;
  }

  // String-returning adapter — execute as JS inside the sandbox.
  const code = out as string;
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
// Env interpolation helpers
// ---------------------------------------------------------------------------

function interpolateEnv(v: unknown): unknown {
  if (typeof v === 'string') {
    if (/\$\{process\.env\.[A-Z0-9_]+\}/.test(v)) {
      return `__BUCK_TPL__${v}__BUCK_TPL__`;
    }
    return v;
  }
  if (Array.isArray(v)) return v.map(interpolateEnv);
  if (v && typeof v === 'object') {
    return Object.fromEntries(
      Object.entries(v as Record<string, unknown>).map(([k, x]) => [k, interpolateEnv(x)])
    );
  }
  return v;
}

const TPL_RE = /"__BUCK_TPL__(.*?)__BUCK_TPL__"/g;

function rewriteTemplates(json: string): string {
  return json.replace(TPL_RE, (_m, inner: string) => '`' + inner.replace(/`/g, '\\`') + '`');
}

interface FetchScriptOpts {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
}

function fetchScript(opts: FetchScriptOpts): string {
  const headersJson = rewriteTemplates(JSON.stringify(interpolateEnv(opts.headers ?? {})));
  const bodyJson =
    opts.body !== undefined
      ? rewriteTemplates(JSON.stringify(interpolateEnv(opts.body)))
      : 'null';
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

// ---------------------------------------------------------------------------
// Adapter registry
// ---------------------------------------------------------------------------

const ADAPTERS: Record<string, Adapter> = {
  // ─── Sandbox: Buck's own runtime ────────────────────────────────────────
  sandbox: {
    'sandbox.run_python': async (a) => {
      const sb = getCurrentSandbox();
      if (!sb) throw new Error('no_sandbox');
      const exec = await sb.runCode(String(a.code), { language: 'python' });
      return JSON.stringify({
        stdout: exec.logs.stdout.join(''),
        stderr: exec.logs.stderr.join(''),
        result: exec.results?.[0]?.text ?? null,
        error: exec.error ? { name: exec.error.name, value: exec.error.value } : null,
      });
    },
    'sandbox.run_js': async (a) => {
      const sb = getCurrentSandbox();
      if (!sb) throw new Error('no_sandbox');
      const exec = await sb.runCode(String(a.code), { language: 'js' });
      return JSON.stringify({
        stdout: exec.logs.stdout.join(''),
        stderr: exec.logs.stderr.join(''),
        result: exec.results?.[0]?.text ?? null,
        error: exec.error ? { name: exec.error.name, value: exec.error.value } : null,
      });
    },
    'sandbox.shell': async (a) => {
      const sb = getCurrentSandbox();
      if (!sb) throw new Error('no_sandbox');
      const result = await sb.commands.run(String(a.command), {
        cwd: a.cwd ? String(a.cwd) : undefined,
        timeoutMs: typeof a.timeout_ms === 'number' ? a.timeout_ms : 60000,
      });
      return JSON.stringify({
        stdout: result.stdout,
        stderr: result.stderr,
        exit_code: result.exitCode,
      });
    },
    'sandbox.write_file': async (a) => {
      const sb = getCurrentSandbox();
      if (!sb) throw new Error('no_sandbox');
      await sb.files.write(String(a.path), String(a.content));
      return JSON.stringify({ ok: true, path: a.path });
    },
    'sandbox.read_file': async (a) => {
      const sb = getCurrentSandbox();
      if (!sb) throw new Error('no_sandbox');
      const content = await sb.files.read(String(a.path));
      return JSON.stringify({ ok: true, content });
    },
    'sandbox.list_dir': async (a) => {
      const sb = getCurrentSandbox();
      if (!sb) throw new Error('no_sandbox');
      const path = a.path ? String(a.path) : '.';
      const entries = await sb.files.list(path);
      return JSON.stringify({ ok: true, path, entries });
    },
    'sandbox.install': async (a) => {
      const sb = getCurrentSandbox();
      if (!sb) throw new Error('no_sandbox');
      const manager = a.manager === 'npm' ? 'npm' : 'pip';
      const pkgs = (a.packages as string[]).map((p) => JSON.stringify(p)).join(' ');
      const cmd = manager === 'pip'
        ? `pip install --break-system-packages ${pkgs}`
        : `npm install ${pkgs}`;
      const result = await sb.commands.run(cmd, { timeoutMs: 180000 });
      return JSON.stringify({
        stdout: result.stdout.slice(-2000),
        stderr: result.stderr.slice(-2000),
        exit_code: result.exitCode,
      });
    },
  },

  // ─── GitHub ─────────────────────────────────────────────────────────────
  github: {
    'github.whoami': () => fetchScript({
      url: 'https://api.github.com/user',
      headers: { Authorization: 'token ${process.env.GITHUB_PAT}', 'User-Agent': 'buck' },
    }),
    'github.search_issues': (a) => fetchScript({
      url: `https://api.github.com/search/issues?q=${encodeURIComponentVar(a.q)}&per_page=${a.per_page ?? 20}${a.sort ? `&sort=${a.sort}` : ''}${a.order ? `&order=${a.order}` : ''}`,
      headers: { Authorization: 'token ${process.env.GITHUB_PAT}', 'User-Agent': 'buck' },
    }),
    'github.search_repos': (a) => fetchScript({
      url: `https://api.github.com/search/repositories?q=${encodeURIComponentVar(a.q)}&per_page=${a.per_page ?? 10}${a.sort ? `&sort=${a.sort}` : ''}`,
      headers: { Authorization: 'token ${process.env.GITHUB_PAT}', 'User-Agent': 'buck' },
    }),
    'github.search_code': (a) => fetchScript({
      url: `https://api.github.com/search/code?q=${encodeURIComponentVar(a.q)}&per_page=${a.per_page ?? 10}`,
      headers: { Authorization: 'token ${process.env.GITHUB_PAT}', 'User-Agent': 'buck', 'Accept': 'application/vnd.github.v3+json' },
    }),
    'github.list_my_repos': (a) => fetchScript({
      url: `https://api.github.com/user/repos?visibility=${a.visibility ?? 'all'}&sort=${a.sort ?? 'updated'}&per_page=${a.per_page ?? 30}`,
      headers: { Authorization: 'token ${process.env.GITHUB_PAT}', 'User-Agent': 'buck' },
    }),
    'github.get_repo': (a) => fetchScript({
      url: `https://api.github.com/repos/${a.owner}/${a.repo}`,
      headers: { Authorization: 'token ${process.env.GITHUB_PAT}', 'User-Agent': 'buck' },
    }),
    'github.create_repo': (a) => fetchScript({
      url: 'https://api.github.com/user/repos',
      method: 'POST',
      headers: { Authorization: 'token ${process.env.GITHUB_PAT}', 'User-Agent': 'buck', 'Content-Type': 'application/json' },
      body: {
        name: a.name,
        description: a.description,
        private: a.private ?? false,
        auto_init: a.auto_init ?? true,
        gitignore_template: a.gitignore_template,
        license_template: a.license_template,
      },
    }),
    'github.get_file': (a) => fetchScript({
      url: `https://api.github.com/repos/${a.owner}/${a.repo}/contents/${a.path}${a.ref ? `?ref=${a.ref}` : ''}`,
      headers: { Authorization: 'token ${process.env.GITHUB_PAT}', 'User-Agent': 'buck' },
    }),
    'github.list_dir': (a) => fetchScript({
      url: `https://api.github.com/repos/${a.owner}/${a.repo}/contents/${a.path ?? ''}${a.ref ? `?ref=${a.ref}` : ''}`,
      headers: { Authorization: 'token ${process.env.GITHUB_PAT}', 'User-Agent': 'buck' },
    }),
    'github.put_file': (a) => `
(async () => {
  try {
    const path = ${JSON.stringify(a.path)};
    const content = ${JSON.stringify(a.content)};
    const b64 = Buffer.from(content, 'utf8').toString('base64');
    const body = {
      message: ${JSON.stringify(a.message)},
      content: b64,
      ${a.branch ? `branch: ${JSON.stringify(a.branch)},` : ''}
      ${a.sha ? `sha: ${JSON.stringify(a.sha)},` : ''}
    };
    const r = await fetch(\`https://api.github.com/repos/${a.owner}/${a.repo}/contents/\${path}\`, {
      method: 'PUT',
      headers: {
        Authorization: \`token \${process.env.GITHUB_PAT}\`,
        'User-Agent': 'buck',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    const text = await r.text();
    let parsed;
    try { parsed = JSON.parse(text); } catch { parsed = text; }
    console.log(JSON.stringify({ ok: r.ok, status: r.status, body: parsed }));
  } catch (e) {
    console.log(JSON.stringify({ ok: false, error: String(e && e.message || e) }));
  }
})();
`,
    'github.get_issue': (a) => fetchScript({
      url: `https://api.github.com/repos/${a.owner}/${a.repo}/issues/${a.number}`,
      headers: { Authorization: 'token ${process.env.GITHUB_PAT}', 'User-Agent': 'buck' },
    }),
    'github.list_issue_comments': (a) => fetchScript({
      url: `https://api.github.com/repos/${a.owner}/${a.repo}/issues/${a.number}/comments`,
      headers: { Authorization: 'token ${process.env.GITHUB_PAT}', 'User-Agent': 'buck' },
    }),
    'github.create_issue': (a) => fetchScript({
      url: `https://api.github.com/repos/${a.owner}/${a.repo}/issues`,
      method: 'POST',
      headers: { Authorization: 'token ${process.env.GITHUB_PAT}', 'User-Agent': 'buck', 'Content-Type': 'application/json' },
      body: { title: a.title, body: a.body, labels: a.labels, assignees: a.assignees },
    }),
    'github.create_issue_comment': (a) => fetchScript({
      url: `https://api.github.com/repos/${a.owner}/${a.repo}/issues/${a.number}/comments`,
      method: 'POST',
      headers: { Authorization: 'token ${process.env.GITHUB_PAT}', 'User-Agent': 'buck', 'Content-Type': 'application/json' },
      body: { body: a.body },
    }),
    'github.close_issue': (a) => fetchScript({
      url: `https://api.github.com/repos/${a.owner}/${a.repo}/issues/${a.number}`,
      method: 'PATCH',
      headers: { Authorization: 'token ${process.env.GITHUB_PAT}', 'User-Agent': 'buck', 'Content-Type': 'application/json' },
      body: { state: 'closed', state_reason: a.reason ?? 'completed' },
    }),
    'github.list_pulls': (a) => fetchScript({
      url: `https://api.github.com/repos/${a.owner}/${a.repo}/pulls?state=${a.state ?? 'open'}&per_page=${a.per_page ?? 20}`,
      headers: { Authorization: 'token ${process.env.GITHUB_PAT}', 'User-Agent': 'buck' },
    }),
    'github.get_pull': (a) => fetchScript({
      url: `https://api.github.com/repos/${a.owner}/${a.repo}/pulls/${a.number}`,
      headers: { Authorization: 'token ${process.env.GITHUB_PAT}', 'User-Agent': 'buck' },
    }),
    'github.create_pull': (a) => fetchScript({
      url: `https://api.github.com/repos/${a.owner}/${a.repo}/pulls`,
      method: 'POST',
      headers: { Authorization: 'token ${process.env.GITHUB_PAT}', 'User-Agent': 'buck', 'Content-Type': 'application/json' },
      body: { title: a.title, body: a.body, head: a.head, base: a.base, draft: a.draft ?? false },
    }),
    'github.create_branch': (a) => `
(async () => {
  try {
    const headers = {
      Authorization: \`token \${process.env.GITHUB_PAT}\`,
      'User-Agent': 'buck',
      'Content-Type': 'application/json',
    };
    let fromBranch = ${JSON.stringify(a.from_branch ?? '')};
    if (!fromBranch) {
      const meta = await fetch(\`https://api.github.com/repos/${a.owner}/${a.repo}\`, { headers });
      const metaJson = await meta.json();
      fromBranch = metaJson.default_branch;
    }
    const refRes = await fetch(\`https://api.github.com/repos/${a.owner}/${a.repo}/git/ref/heads/\${fromBranch}\`, { headers });
    const refJson = await refRes.json();
    if (!refRes.ok) {
      console.log(JSON.stringify({ ok: false, status: refRes.status, body: refJson }));
      return;
    }
    const sha = refJson.object.sha;
    const create = await fetch(\`https://api.github.com/repos/${a.owner}/${a.repo}/git/refs\`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ref: \`refs/heads/${a.new_branch}\`, sha }),
    });
    const createJson = await create.json();
    console.log(JSON.stringify({ ok: create.ok, status: create.status, body: createJson }));
  } catch (e) {
    console.log(JSON.stringify({ ok: false, error: String(e && e.message || e) }));
  }
})();
`,
  },

  // ─── Slack ───────────────────────────────────────────────────────────────
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

  // ─── Stubs (TODO: full adapters) ─────────────────────────────────────────
  gmail: stubAdapter('gmail'),
  'google-drive': stubAdapter('google-drive'),
  'google-calendar': stubAdapter('google-calendar'),
  notion: stubAdapter('notion'),
  linear: stubAdapter('linear'),
  airtable: stubAdapter('airtable'),

  // ─── Resend ──────────────────────────────────────────────────────────────
  resend: {
    'resend.send': (a) => fetchScript({
      url: 'https://api.resend.com/emails',
      method: 'POST',
      headers: { Authorization: 'Bearer ${process.env.RESEND_API_KEY}', 'Content-Type': 'application/json' },
      body: { from: '${process.env.RESEND_FROM}', to: a.to, subject: a.subject, html: a.html, text: a.text },
    }),
  },

  // ─── Firecrawl ───────────────────────────────────────────────────────────
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