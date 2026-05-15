import type { IntegrationManifest } from './index';

// =============================================================================
// Sandbox — Buck's own E2B code interpreter
// =============================================================================
// Unlike other integrations, this one needs no user-supplied credentials.
// The sandbox is already running because Buck himself runs inside it.
// Auto-enabled for every user.
// =============================================================================

export const manifest: IntegrationManifest = {
  service: 'sandbox',
  display_name: 'Sandbox',
  category: 'dev',
  description:
    "Buck's own scratch space. Run code, edit files, install packages, and iterate without leaving the box.",
  badge_color: '#3a5a40',
  env_vars: [],
  setup_instructions: `
This integration is **always on**. There's nothing to configure.

Buck runs inside an E2B sandbox during every session. These tools let him use
the sandbox itself — writing code, running it, reading the output, editing
files. He uses this to build, test, and iterate on real software during a
session, the same way a developer would at a terminal.

The sandbox is destroyed when the session ends. Anything Buck wants to keep
must be committed to a real destination (a GitHub repo, a Drive folder, etc.)
before he clocks off.
  `.trim(),
  tools: [
    {
      name: 'sandbox.run_python',
      description:
        'Execute Python code in the sandbox. Returns stdout, stderr, and the value of the last expression. Use for one-off calculations, data processing, or testing logic. State persists between calls within a session.',
      parameters: {
        type: 'object',
        properties: {
          code: { type: 'string', description: 'Python source. Multiple statements allowed.' },
        },
        required: ['code'],
      },
    },
    {
      name: 'sandbox.run_js',
      description:
        'Execute JavaScript code in the sandbox (Node.js). Returns stdout and stderr. Use for testing JS modules you have written, hitting APIs, or quick scripting.',
      parameters: {
        type: 'object',
        properties: {
          code: { type: 'string' },
        },
        required: ['code'],
      },
    },
    {
      name: 'sandbox.shell',
      description:
        "Run a shell command in the sandbox. Use for git, npm, pip, ls, cat, anything you'd type at a terminal.",
      parameters: {
        type: 'object',
        properties: {
          command: { type: 'string' },
          cwd: { type: 'string', description: 'Working directory. Defaults to /home/user.' },
          timeout_ms: { type: 'integer', default: 60000, maximum: 600000 },
        },
        required: ['command'],
      },
    },
    {
      name: 'sandbox.write_file',
      description:
        "Create or overwrite a file in the sandbox filesystem. The sandbox is wiped at session end — commit anything important.",
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Absolute or relative to /home/user.' },
          content: { type: 'string' },
        },
        required: ['path', 'content'],
      },
    },
    {
      name: 'sandbox.read_file',
      description: 'Read the contents of a file from the sandbox.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string' },
        },
        required: ['path'],
      },
    },
    {
      name: 'sandbox.list_dir',
      description: 'List files and directories at the given path.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', default: '.' },
        },
      },
    },
    {
      name: 'sandbox.install',
      description:
        "Install a package via pip or npm. Pass the manager and one or more package names.",
      parameters: {
        type: 'object',
        properties: {
          manager: { type: 'string', enum: ['pip', 'npm'] },
          packages: { type: 'array', items: { type: 'string' }, minItems: 1 },
        },
        required: ['manager', 'packages'],
      },
    },
  ],
};