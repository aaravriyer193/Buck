import type { IntegrationManifest } from './index';

export const manifest: IntegrationManifest = {
  service: 'firecrawl',
  display_name: 'Firecrawl',
  category: 'browse',
  description: 'Scrape and crawl web pages, returning clean markdown.',
  badge_color: '#ff5722',
  env_vars: [
    {
      name: 'FIRECRAWL_API_KEY',
      label: 'API key',
      secret: true,
      example: 'fc-...',
    },
  ],
  setup_instructions: `
1. Sign up at https://www.firecrawl.dev/
2. From your dashboard, copy your API key
3. Paste it below
  `.trim(),
  tools: [
    {
      name: 'firecrawl.scrape',
      description: 'Scrape a single URL and return its content as markdown.',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string' },
          only_main_content: { type: 'boolean', default: true },
        },
        required: ['url'],
      },
    },
    {
      name: 'firecrawl.search',
      description: 'Search the web and return results with optional content scraping.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string' },
          limit: { type: 'integer', maximum: 25, default: 10 },
          fetch_content: { type: 'boolean', default: false },
        },
        required: ['query'],
      },
    },
  ],
};
