// =============================================================================
// Buck — sandbox context
// =============================================================================
// Holds the active E2B sandbox for the current Buck session. Used by the tool
// runner to dispatch JS adapter snippets without threading the sandbox through
// every call site.
// =============================================================================

import type { Sandbox } from '@e2b/code-interpreter';

let activeSandbox: Sandbox | null = null;

export function setCurrentSandbox(sandbox: Sandbox | null) {
  activeSandbox = sandbox;
}

export function getCurrentSandbox(): Sandbox | null {
  return activeSandbox;
}
