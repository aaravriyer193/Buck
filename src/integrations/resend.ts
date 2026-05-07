import type { IntegrationManifest } from './index';

export const manifest: IntegrationManifest = {
  service: 'resend',
  display_name: 'Resend',
  category: 'communication',
  description: 'Send transactional email via Resend.',
  badge_color: '#1c1611',
  env_vars: [
    {
      name: 'RESEND_API_KEY',
      label: 'API key',
      secret: true,
      example: 're_...',
    },
    {
      name: 'RESEND_FROM',
      label: 'From address',
      help: 'A verified sender on a domain you own.',
      example: 'updates@yourdomain.com',
    },
  ],
  setup_instructions: `
1. Visit https://resend.com/api-keys and create a key
2. Verify the domain you'll send from
3. Paste the key and your verified \`From\` address below
  `.trim(),
  tools: [
    {
      name: 'resend.send',
      description: 'Send an email through Resend.',
      destructive: true,
      parameters: {
        type: 'object',
        properties: {
          to: { type: 'string' },
          subject: { type: 'string' },
          html: { type: 'string' },
          text: { type: 'string' },
        },
        required: ['to', 'subject'],
      },
    },
  ],
};
