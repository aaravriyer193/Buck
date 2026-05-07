import type { IntegrationManifest } from './index';

export const manifest: IntegrationManifest = {
  service: 'airtable',
  display_name: 'Airtable',
  category: 'data',
  description: 'Read and write records in your Airtable bases.',
  badge_color: '#fcb400',
  env_vars: [
    {
      name: 'AIRTABLE_PAT',
      label: 'Personal access token',
      help: 'A scoped token from Airtable.',
      secret: true,
    },
  ],
  setup_instructions: `
1. Visit https://airtable.com/create/tokens
2. Create a token with the bases and scopes Buck needs:
   - \`data.records:read\` — read records
   - \`data.records:write\` — create/update records
   - \`schema.bases:read\` — list base structure
3. Restrict the token to specific bases — never grant access to all
4. Paste it below
  `.trim(),
  tools: [
    {
      name: 'airtable.list_records',
      description: 'List records from a table with optional formula filter.',
      parameters: {
        type: 'object',
        properties: {
          base_id: { type: 'string' },
          table: { type: 'string', description: 'Table name or id' },
          formula: { type: 'string', description: 'Airtable formula' },
          max_records: { type: 'integer', maximum: 100, default: 25 },
        },
        required: ['base_id', 'table'],
      },
    },
    {
      name: 'airtable.create_record',
      description: 'Create a record in a table.',
      destructive: true,
      parameters: {
        type: 'object',
        properties: {
          base_id: { type: 'string' },
          table: { type: 'string' },
          fields: { type: 'object' },
        },
        required: ['base_id', 'table', 'fields'],
      },
    },
    {
      name: 'airtable.update_record',
      description: 'Update a record by id.',
      destructive: true,
      parameters: {
        type: 'object',
        properties: {
          base_id: { type: 'string' },
          table: { type: 'string' },
          record_id: { type: 'string' },
          fields: { type: 'object' },
        },
        required: ['base_id', 'table', 'record_id', 'fields'],
      },
    },
  ],
};
