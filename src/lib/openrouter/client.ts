// =============================================================================
// OpenRouter client
// =============================================================================
// Thin wrapper around the OpenAI-compatible OpenRouter API with automatic
// fallback to a backup model on 5xx and per-call cost reporting.
// =============================================================================

const ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_call_id?: string;
  name?: string;
  tool_calls?: ToolCall[];
}

export interface ToolDef {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
}

export interface ChatResult {
  content: string;
  tool_calls?: ToolCall[];
  model: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  /** Cost in USD as reported by OpenRouter (the most reliable source). */
  cost_usd: number;
  finish_reason: string | null;
}

export interface ChatOptions {
  model?: string;
  fallbackModel?: string;
  messages: ChatMessage[];
  tools?: ToolDef[];
  temperature?: number;
  maxTokens?: number;
  toolChoice?: 'auto' | 'none' | 'required';
  signal?: AbortSignal;
}

async function callOnce(model: string, opts: ChatOptions): Promise<ChatResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not set');

  const body: Record<string, unknown> = {
    model,
    messages: opts.messages,
    temperature: opts.temperature ?? 0.4,
    max_tokens: opts.maxTokens ?? 4096,
    // Ask OpenRouter to return cost data in the response.
    usage: { include: true },
  };
  if (opts.tools?.length) {
    body.tools = opts.tools;
    body.tool_choice = opts.toolChoice ?? 'auto';
  }

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://buck.dev',
      'X-Title': 'Buck',
    },
    body: JSON.stringify(body),
    signal: opts.signal,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    const err = new Error(`OpenRouter ${res.status}: ${text || res.statusText}`);
    (err as Error & { status?: number }).status = res.status;
    throw err;
  }

  const json = await res.json();
  const choice = json.choices?.[0];
  if (!choice) throw new Error('OpenRouter returned no choices');

  return {
    content: choice.message?.content ?? '',
    tool_calls: choice.message?.tool_calls,
    model: json.model ?? model,
    usage: {
      prompt_tokens: json.usage?.prompt_tokens ?? 0,
      completion_tokens: json.usage?.completion_tokens ?? 0,
      total_tokens: json.usage?.total_tokens ?? 0,
    },
    cost_usd: Number(json.usage?.cost ?? 0),
    finish_reason: choice.finish_reason ?? null,
  };
}

export async function chat(opts: ChatOptions): Promise<ChatResult> {
  const primary = opts.model || process.env.OPENROUTER_DEFAULT_MODEL || 'zhipu/glm-5';
  const fallback = opts.fallbackModel || process.env.OPENROUTER_FALLBACK_MODEL;

  try {
    return await callOnce(primary, opts);
  } catch (err) {
    const status = (err as Error & { status?: number }).status;
    if (fallback && (status === undefined || status >= 500)) {
      return await callOnce(fallback, opts);
    }
    throw err;
  }
}
