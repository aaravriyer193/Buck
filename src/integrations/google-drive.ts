import type { IntegrationManifest } from './index';

export const manifest: IntegrationManifest = {
  service: 'google-drive',
  display_name: 'Google Drive',
  category: 'storage',
  description: 'Search, read, and create files in your Google Drive.',
  badge_color: '#0f9d58',
  env_vars: [
    {
      name: 'GDRIVE_OAUTH_REFRESH_TOKEN',
      label: 'OAuth refresh token',
      secret: true,
    },
    {
      name: 'GDRIVE_OAUTH_CLIENT_ID',
      label: 'OAuth client ID',
    },
    {
      name: 'GDRIVE_OAUTH_CLIENT_SECRET',
      label: 'OAuth client secret',
      secret: true,
    },
  ],
  setup_instructions: `
1. In Google Cloud Console, enable the **Drive API**
2. Create an OAuth 2.0 Client (Desktop or Web)
3. Run a one-off OAuth flow with the scopes you need:
   - \`drive.readonly\` — read only (recommended)
   - \`drive.file\` — read/write only files Buck creates
   - \`drive\` — full access (avoid)
4. Save the refresh token, client ID, and secret. Paste below.
  `.trim(),
  tools: [
    {
      name: 'gdrive.search',
      description: 'Search files in Drive by name or content.',
      parameters: {
        type: 'object',
        properties: {
          q: { type: 'string', description: 'Drive search query, e.g. "name contains \'invoice\'"' },
          page_size: { type: 'integer', maximum: 100, default: 25 },
        },
        required: ['q'],
      },
    },
    {
      name: 'gdrive.read_file',
      description: 'Read the contents of a file (text, Google Docs export to text).',
      parameters: {
        type: 'object',
        properties: { file_id: { type: 'string' } },
        required: ['file_id'],
      },
    },
    {
      name: 'gdrive.create_doc',
      description: 'Create a Google Doc with the given title and plain text body.',
      destructive: true,
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          body: { type: 'string' },
          folder_id: { type: 'string' },
        },
        required: ['title', 'body'],
      },
    },
  ],
};
