import type { IntegrationManifest } from './index';

export const manifest: IntegrationManifest = {
  service: 'linear',
  display_name: 'Linear',
  category: 'productivity',
  description: 'Read and create issues across your Linear workspace.',
  badge_color: '#5e6ad2',
  env_vars: [
    {
      name: 'LINEAR_API_KEY',
      label: 'API key',
      help: 'A personal API key from Linear.',
      secret: true,
      example: 'lin_api_...',
    },
  ],
  setup_instructions: `
1. In Linear, go to **Settings → API → Personal API Keys**
2. Click **Create key**, give it a name like "Buck"
3. Copy the key (you won't see it again)
4. Paste it below
  `.trim(),
  tools: [
    {
      name: 'linear.search_issues',
      description: 'Search Linear issues with a free-text query.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string' },
          state: { type: 'string', description: 'Filter by state (e.g. "Todo", "In Progress").' },
          assignee_email: { type: 'string' },
          limit: { type: 'integer', minimum: 1, maximum: 50, default: 20 },
        },
        required: ['query'],
      },
    },
    {
      name: 'linear.get_issue',
      description: 'Fetch a single issue by identifier (e.g. "ENG-123").',
      parameters: {
        type: 'object',
        properties: { identifier: { type: 'string' } },
        required: ['identifier'],
      },
    },
    {
      name: 'linear.create_issue',
      description: 'Create a new issue.',
      destructive: true,
      parameters: {
        type: 'object',
        properties: {
          team_key: { type: 'string', description: 'Team key, e.g. "ENG".' },
          title: { type: 'string' },
          description: { type: 'string' },
          assignee_email: { type: 'string' },
          priority: { type: 'integer', minimum: 0, maximum: 4 },
        },
        required: ['team_key', 'title'],
      },
    },
    {
      name: 'linear.add_comment',
      description: 'Add a comment to an issue.',
      destructive: true,
      parameters: {
        type: 'object',
        properties: {
          identifier: { type: 'string' },
          body: { type: 'string' },
        },
        required: ['identifier', 'body'],
      },
    },
  ],
};
