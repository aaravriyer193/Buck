import type { IntegrationManifest } from './index';

export const manifest: IntegrationManifest = {
  service: 'gmail',
  display_name: 'Gmail',
  category: 'communication',
  description: 'Read, search, and send email through your Gmail account.',
  badge_color: '#c5221f',
  env_vars: [
    {
      name: 'GMAIL_OAUTH_REFRESH_TOKEN',
      label: 'OAuth refresh token',
      help: 'Refresh token from a Google OAuth flow with gmail.modify scope.',
      secret: true,
    },
    {
      name: 'GMAIL_OAUTH_CLIENT_ID',
      label: 'OAuth client ID',
      help: 'Your Google Cloud OAuth client ID.',
    },
    {
      name: 'GMAIL_OAUTH_CLIENT_SECRET',
      label: 'OAuth client secret',
      secret: true,
    },
  ],
  setup_instructions: `
Bringing your own Google OAuth credentials keeps you in control of scope.

1. In Google Cloud Console, create an OAuth 2.0 Client (Desktop or Web type)
2. Enable the **Gmail API** for your project
3. Run a one-off OAuth flow with the scopes you want Buck to use:
   - \`gmail.readonly\` — search and read only (recommended)
   - \`gmail.send\` — send messages
   - \`gmail.modify\` — full access including delete (use with caution)
4. Save the resulting **refresh token**, **client ID**, and **client secret**
5. Paste all three below

> **Sending email is in Buck's default approval list.** Even with the right scopes, Buck will pause and ask you before sending unless you change that in Settings.
  `.trim(),
  tools: [
    {
      name: 'gmail.search',
      description: 'Search messages using Gmail search syntax (e.g. "from:foo@bar.com newer_than:7d").',
      parameters: {
        type: 'object',
        properties: {
          q: { type: 'string' },
          max: { type: 'integer', minimum: 1, maximum: 50, default: 20 },
        },
        required: ['q'],
      },
    },
    {
      name: 'gmail.get_message',
      description: 'Fetch a single message by id, including body.',
      parameters: {
        type: 'object',
        properties: { id: { type: 'string' } },
        required: ['id'],
      },
    },
    {
      name: 'gmail.send',
      description: 'Send an email.',
      destructive: true,
      parameters: {
        type: 'object',
        properties: {
          to: { type: 'string' },
          subject: { type: 'string' },
          body: { type: 'string' },
          cc: { type: 'string' },
          reply_to_message_id: { type: 'string' },
        },
        required: ['to', 'subject', 'body'],
      },
    },
  ],
};
