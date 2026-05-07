import type { IntegrationManifest } from './index';

export const manifest: IntegrationManifest = {
  service: 'slack',
  display_name: 'Slack',
  category: 'communication',
  description: 'Read messages, post to channels, and search your Slack workspace.',
  badge_color: '#4a154b',
  env_vars: [
    {
      name: 'SLACK_BOT_TOKEN',
      label: 'Bot user OAuth token',
      help: 'Starts with xoxb-. From your Slack app under OAuth & Permissions.',
      secret: true,
      example: 'xoxb-...',
    },
  ],
  setup_instructions: `
1. Create or open a Slack app at https://api.slack.com/apps
2. Under **OAuth & Permissions**, add the bot scopes you want Buck to use:
   - \`channels:read\`, \`channels:history\` — read public channels
   - \`chat:write\` — post messages
   - \`search:read\` — search workspace
3. Install the app to your workspace
4. Copy the **Bot User OAuth Token** (starts with \`xoxb-\`)
5. Paste it below. Restrict the bot's channel access to only what Buck needs.
  `.trim(),
  tools: [
    {
      name: 'slack.list_channels',
      description: 'List channels the bot has access to.',
      parameters: {
        type: 'object',
        properties: {
          types: { type: 'string', default: 'public_channel,private_channel' },
        },
      },
    },
    {
      name: 'slack.history',
      description: 'Fetch recent messages from a channel.',
      parameters: {
        type: 'object',
        properties: {
          channel: { type: 'string', description: 'Channel ID (e.g. C0123456789)' },
          limit: { type: 'integer', minimum: 1, maximum: 200, default: 50 },
        },
        required: ['channel'],
      },
    },
    {
      name: 'slack.post_message',
      description: 'Post a message to a channel.',
      destructive: true,
      parameters: {
        type: 'object',
        properties: {
          channel: { type: 'string' },
          text: { type: 'string' },
          thread_ts: { type: 'string', description: 'Optional. Reply in a thread.' },
        },
        required: ['channel', 'text'],
      },
    },
    {
      name: 'slack.search',
      description: 'Search messages across the workspace.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string' },
          count: { type: 'integer', minimum: 1, maximum: 50, default: 20 },
        },
        required: ['query'],
      },
    },
  ],
};
