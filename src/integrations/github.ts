import type { IntegrationManifest } from './index';

export const manifest: IntegrationManifest = {
  service: 'github',
  display_name: 'GitHub',
  category: 'dev',
  description: 'Read and write across GitHub — issues, PRs, repository contents, files, comments, and more.',
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
   - **Write**: Issues, Pull requests, Contents (only if Buck should comment, open PRs, or commit files)
   - **Administration**: Read/Write (only if Buck should create or modify repos)
5. Paste the token here. Buck never sees this token outside an isolated sandbox.
  `.trim(),
  tools: [
    // ─────────────────────────────────────────────────────────────────────
    // User & meta
    // ─────────────────────────────────────────────────────────────────────
    {
      name: 'github.whoami',
      description: 'Return the authenticated user (handle, name, scopes). Use this first if you are unsure who you are.',
      parameters: { type: 'object', properties: {} },
    },

    // ─────────────────────────────────────────────────────────────────────
    // Search
    // ─────────────────────────────────────────────────────────────────────
    {
      name: 'github.search_issues',
      description: 'Search issues and PRs across GitHub using the issues search syntax.',
      parameters: {
        type: 'object',
        properties: {
          q: { type: 'string', description: 'Search query (e.g. "repo:owner/name is:open label:bug")' },
          per_page: { type: 'integer', minimum: 1, maximum: 50, default: 20 },
          sort: { type: 'string', enum: ['comments', 'reactions', 'created', 'updated'] },
          order: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
        },
        required: ['q'],
      },
    },
    {
      name: 'github.search_repos',
      description: 'Search public repositories.',
      parameters: {
        type: 'object',
        properties: {
          q: { type: 'string', description: 'e.g. "language:typescript stars:>100 agent"' },
          per_page: { type: 'integer', minimum: 1, maximum: 50, default: 10 },
          sort: { type: 'string', enum: ['stars', 'forks', 'updated'] },
        },
        required: ['q'],
      },
    },
    {
      name: 'github.search_code',
      description: 'Search code across GitHub. Requires the token to have access to the repos in scope.',
      parameters: {
        type: 'object',
        properties: {
          q: { type: 'string', description: 'e.g. "fetch repo:vercel/next.js path:src"' },
          per_page: { type: 'integer', minimum: 1, maximum: 50, default: 10 },
        },
        required: ['q'],
      },
    },

    // ─────────────────────────────────────────────────────────────────────
    // Repos
    // ─────────────────────────────────────────────────────────────────────
    {
      name: 'github.list_my_repos',
      description: 'List repositories owned by or visible to the authenticated user.',
      parameters: {
        type: 'object',
        properties: {
          visibility: { type: 'string', enum: ['all', 'public', 'private'], default: 'all' },
          sort: { type: 'string', enum: ['created', 'updated', 'pushed', 'full_name'], default: 'updated' },
          per_page: { type: 'integer', minimum: 1, maximum: 100, default: 30 },
        },
      },
    },
    {
      name: 'github.get_repo',
      description: 'Fetch metadata about a single repo (description, topics, default branch, stars, etc.).',
      parameters: {
        type: 'object',
        properties: {
          owner: { type: 'string' },
          repo: { type: 'string' },
        },
        required: ['owner', 'repo'],
      },
    },
    {
      name: 'github.create_repo',
      description: "Create a new repository under the authenticated user's account.",
      destructive: true,
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          private: { type: 'boolean', default: false },
          auto_init: { type: 'boolean', default: true, description: 'Initialize with an empty README so commits work right away.' },
          gitignore_template: { type: 'string', description: 'e.g. "Node", "Python".' },
          license_template: { type: 'string', description: 'e.g. "mit", "apache-2.0".' },
        },
        required: ['name'],
      },
    },

    // ─────────────────────────────────────────────────────────────────────
    // File contents
    // ─────────────────────────────────────────────────────────────────────
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
    {
      name: 'github.list_dir',
      description: 'List the contents of a directory in a repo.',
      parameters: {
        type: 'object',
        properties: {
          owner: { type: 'string' },
          repo: { type: 'string' },
          path: { type: 'string', default: '' },
          ref: { type: 'string' },
        },
        required: ['owner', 'repo'],
      },
    },
    {
      name: 'github.put_file',
      description:
        'Create or update a file in a repository. Pass `sha` only if updating an existing file (get it from github.get_file first).',
      destructive: true,
      parameters: {
        type: 'object',
        properties: {
          owner: { type: 'string' },
          repo: { type: 'string' },
          path: { type: 'string' },
          content: { type: 'string', description: 'Plain text. Will be base64-encoded for you.' },
          message: { type: 'string', description: 'Commit message.' },
          branch: { type: 'string', description: 'Defaults to repo default branch.' },
          sha: { type: 'string', description: 'Required when updating; omit when creating.' },
        },
        required: ['owner', 'repo', 'path', 'content', 'message'],
      },
    },

    // ─────────────────────────────────────────────────────────────────────
    // Issues
    // ─────────────────────────────────────────────────────────────────────
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
      name: 'github.create_issue',
      description: 'Open a new issue.',
      destructive: true,
      parameters: {
        type: 'object',
        properties: {
          owner: { type: 'string' },
          repo: { type: 'string' },
          title: { type: 'string' },
          body: { type: 'string' },
          labels: { type: 'array', items: { type: 'string' } },
          assignees: { type: 'array', items: { type: 'string' } },
        },
        required: ['owner', 'repo', 'title'],
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
      name: 'github.close_issue',
      description: 'Close an issue.',
      destructive: true,
      parameters: {
        type: 'object',
        properties: {
          owner: { type: 'string' },
          repo: { type: 'string' },
          number: { type: 'integer' },
          reason: { type: 'string', enum: ['completed', 'not_planned'], default: 'completed' },
        },
        required: ['owner', 'repo', 'number'],
      },
    },

    // ─────────────────────────────────────────────────────────────────────
    // Pull requests
    // ─────────────────────────────────────────────────────────────────────
    {
      name: 'github.list_pulls',
      description: 'List PRs in a repo.',
      parameters: {
        type: 'object',
        properties: {
          owner: { type: 'string' },
          repo: { type: 'string' },
          state: { type: 'string', enum: ['open', 'closed', 'all'], default: 'open' },
          per_page: { type: 'integer', minimum: 1, maximum: 50, default: 20 },
        },
        required: ['owner', 'repo'],
      },
    },
    {
      name: 'github.get_pull',
      description: 'Fetch a PR by number, including head/base SHAs and merge status.',
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
      name: 'github.create_pull',
      description: 'Open a pull request from `head` into `base`. Both must be branches that already exist.',
      destructive: true,
      parameters: {
        type: 'object',
        properties: {
          owner: { type: 'string' },
          repo: { type: 'string' },
          title: { type: 'string' },
          body: { type: 'string' },
          head: { type: 'string', description: 'The branch with your changes.' },
          base: { type: 'string', description: 'The branch to merge into (usually main).' },
          draft: { type: 'boolean', default: false },
        },
        required: ['owner', 'repo', 'title', 'head', 'base'],
      },
    },

    // ─────────────────────────────────────────────────────────────────────
    // Branches
    // ─────────────────────────────────────────────────────────────────────
    {
      name: 'github.create_branch',
      description: 'Create a new branch from an existing one.',
      destructive: true,
      parameters: {
        type: 'object',
        properties: {
          owner: { type: 'string' },
          repo: { type: 'string' },
          new_branch: { type: 'string' },
          from_branch: { type: 'string', description: 'Defaults to the repo default branch.' },
        },
        required: ['owner', 'repo', 'new_branch'],
      },
    },
  ],
};