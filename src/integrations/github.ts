import type { IntegrationManifest } from './index';

export const manifest: IntegrationManifest = {
  service: 'github',
  display_name: 'GitHub',
  category: 'dev',
  description: 'Read and write issues, PRs, repository contents, and run searches across GitHub.',
  badge_color: '#1c1611',
  env_vars: [
    {
      name: 'GITHUB_PAT',
      label: 'Personal access token',
      help: 'A fine-grained PAT with the scopes you want Buck to have. Avoid full repo:write unless needed.',
      secret: true,
      example: 'github_pat_11ABC...',
    },
  ],
  setup_instructions: `
1. Visit https://github.com/settings/tokens?type=beta
2. Create a **fine-grained personal access token**
3. Restrict it to the repositories Buck should touch
4. Grant the smallest set of permissions you need:
   - **Read**: Issues, Pull requests, Contents, Metadata
   - **Write**: Issues, Pull requests (only if Buck should comment or open PRs)
5. Paste the token here. Buck never sees this token outside an isolated sandbox.
  `.trim(),
  tools: [
    {
      name: 'github.search_issues',
      description: 'Search issues and PRs across GitHub using the issues search syntax.',
      parameters: {
        type: 'object',
        properties: {
          q: { type: 'string', description: 'Search query (e.g. "repo:owner/name is:open label:bug")' },
          per_page: { type: 'integer', minimum: 1, maximum: 50, default: 20 },
        },
        required: ['q'],
      },
    },
    {
      name: 'github.get_issue',
      description: 'Fetch a single issue or PR by repo + number.',
      parameters: {
        type: 'object',
        properties: {
          owner: { type: 'string' },
          repo: { type: 'string' },
          number: { type: 'integer' },
        },
        required: ['owner', 'repo', 'number'],
      },
    },
    {
      name: 'github.list_issue_comments',
      description: 'List comments on an issue or PR.',
      parameters: {
        type: 'object',
        properties: {
          owner: { type: 'string' },
          repo: { type: 'string' },
          number: { type: 'integer' },
        },
        required: ['owner', 'repo', 'number'],
      },
    },
    {
      name: 'github.create_issue_comment',
      description: 'Post a comment on an issue or PR.',
      destructive: true,
      parameters: {
        type: 'object',
        properties: {
          owner: { type: 'string' },
          repo: { type: 'string' },
          number: { type: 'integer' },
          body: { type: 'string' },
        },
        required: ['owner', 'repo', 'number', 'body'],
      },
    },
    {
      name: 'github.get_file',
      description: 'Read a file from a repository at a specific ref.',
      parameters: {
        type: 'object',
        properties: {
          owner: { type: 'string' },
          repo: { type: 'string' },
          path: { type: 'string' },
          ref: { type: 'string', description: 'Branch, tag, or commit SHA. Defaults to default branch.' },
        },
        required: ['owner', 'repo', 'path'],
      },
    },
  ],
};
