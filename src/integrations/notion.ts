import type { IntegrationManifest } from './index';

export const manifest: IntegrationManifest = {
  service: 'notion',
  display_name: 'Notion',
  category: 'productivity',
  description: 'Search, read, and update pages and databases in your Notion workspace.',
  badge_color: '#1c1611',
  env_vars: [
    {
      name: 'NOTION_API_KEY',
      label: 'Internal integration token',
      help: 'Token from a Notion integration with access to the pages you want Buck to use.',
      secret: true,
      example: 'secret_...',
    },
  ],
  setup_instructions: `
1. Go to https://www.notion.so/my-integrations and click **+ New integration**
2. Set the type to **Internal**, choose your workspace
3. Under **Capabilities**, grant only what Buck needs (Read content is the minimum)
4. Copy the **Internal Integration Token**
5. **Important:** open each page or database you want Buck to access and click ⋯ → **Add connections** → select your integration. Buck cannot see anything you haven't explicitly shared.
6. Paste the token below
  `.trim(),
  tools: [
    {
      name: 'notion.search',
      description: 'Search pages and databases by text.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string' },
          filter_object: { type: 'string', enum: ['page', 'database'] },
        },
        required: ['query'],
      },
    },
    {
      name: 'notion.get_page',
      description: 'Fetch a page including its content blocks.',
      parameters: {
        type: 'object',
        properties: { page_id: { type: 'string' } },
        required: ['page_id'],
      },
    },
    {
      name: 'notion.query_database',
      description: 'Query a Notion database with optional filters and sorts.',
      parameters: {
        type: 'object',
        properties: {
          database_id: { type: 'string' },
          filter: { type: 'object', description: 'Notion filter object.' },
          page_size: { type: 'integer', maximum: 100, default: 25 },
        },
        required: ['database_id'],
      },
    },
    {
      name: 'notion.append_blocks',
      description: 'Append blocks (paragraphs, todos, etc.) to a page.',
      destructive: true,
      parameters: {
        type: 'object',
        properties: {
          page_id: { type: 'string' },
          blocks: { type: 'array', items: { type: 'object' } },
        },
        required: ['page_id', 'blocks'],
      },
    },
  ],
};
