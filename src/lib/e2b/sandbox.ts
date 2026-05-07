// =============================================================================
// E2B sandbox helpers
// =============================================================================
// Buck runs inside an E2B Code Interpreter sandbox. We boot the sandbox with
// the user's encrypted integration secrets injected as environment variables
// and expose a small API for the orchestrator to drive it.
//
// Note: this module is server-only.
// =============================================================================

import { Sandbox } from '@e2b/code-interpreter';

export interface BootOptions {
  apiKey?: string;
  templateId?: string;
  envs: Record<string, string>;
  timeoutMs: number;
}

export async function bootSandbox(opts: BootOptions): Promise<Sandbox> {
  const apiKey = opts.apiKey || process.env.E2B_API_KEY;
  if (!apiKey) throw new Error('E2B_API_KEY not set');

  const sandbox = await Sandbox.create(opts.templateId || process.env.E2B_TEMPLATE_ID || 'base', {
    apiKey,
    envs: opts.envs,
    timeoutMs: opts.timeoutMs,
  });

  return sandbox;
}

/**
 * Run a JS/TS snippet in the sandbox and return stdout/stderr.
 * Used by integration health-checks and tool invocations.
 */
export async function runJS(sandbox: Sandbox, code: string): Promise<{ stdout: string; stderr: string }> {
  const exec = await sandbox.runCode(code, { language: 'js' });
  return {
    stdout: exec.logs.stdout.join(''),
    stderr: exec.logs.stderr.join(''),
  };
}
