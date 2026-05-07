import type { IntegrationManifest } from './index';

export const manifest: IntegrationManifest = {
  service: 'google-calendar',
  display_name: 'Google Calendar',
  category: 'calendar',
  description: 'Read your calendar and create or update events.',
  badge_color: '#4285f4',
  env_vars: [
    { name: 'GCAL_OAUTH_REFRESH_TOKEN', label: 'OAuth refresh token', secret: true },
    { name: 'GCAL_OAUTH_CLIENT_ID', label: 'OAuth client ID' },
    { name: 'GCAL_OAUTH_CLIENT_SECRET', label: 'OAuth client secret', secret: true },
  ],
  setup_instructions: `
1. Enable the **Google Calendar API** in your Google Cloud project
2. Use the same OAuth client you set up for Drive/Gmail (or create a new one)
3. OAuth scopes:
   - \`calendar.readonly\` — read only
   - \`calendar.events\` — create/update events on calendars you own
4. Paste the refresh token and client credentials below
  `.trim(),
  tools: [
    {
      name: 'gcal.list_events',
      description: 'List upcoming events on a calendar.',
      parameters: {
        type: 'object',
        properties: {
          calendar_id: { type: 'string', default: 'primary' },
          time_min: { type: 'string', description: 'ISO 8601' },
          time_max: { type: 'string', description: 'ISO 8601' },
          max_results: { type: 'integer', maximum: 100, default: 25 },
        },
      },
    },
    {
      name: 'gcal.create_event',
      description: 'Create a calendar event. Approval required by default.',
      destructive: true,
      parameters: {
        type: 'object',
        properties: {
          calendar_id: { type: 'string', default: 'primary' },
          summary: { type: 'string' },
          description: { type: 'string' },
          start: { type: 'string', description: 'ISO 8601' },
          end: { type: 'string', description: 'ISO 8601' },
          attendees: { type: 'array', items: { type: 'string' } },
        },
        required: ['summary', 'start', 'end'],
      },
    },
  ],
};
