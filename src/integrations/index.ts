// =============================================================================
// Integration manifests
// =============================================================================
// Each integration is a small declarative object describing:
//   - service id, display name, icon
//   - the env vars Buck needs (which the user pastes into the vault)
//   - the tool surface Buck can call
//   - setup instructions
//
// The user brings their own tokens. We never broker OAuth or hold third-party
// credentials at the platform level.
// =============================================================================

export interface EnvVarSpec {
  name: string;
  label: string;
  help?: string;
  secret?: boolean;
  optional?: boolean;
  example?: string;
}

export interface ToolSpec {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  destructive?: boolean;
}

export interface IntegrationManifest {
  service: string;
  display_name: string;
  category:
    | 'communication'
    | 'productivity'
    | 'storage'
    | 'calendar'
    | 'dev'
    | 'data'
    | 'crm'
    | 'browse'
    | 'misc';
  description: string;
  env_vars: EnvVarSpec[];
  setup_instructions: string;
  tools: ToolSpec[];
  badge_color?: string;
}

import { manifest as sandbox } from './sandbox';
import { manifest as gmail } from './gmail';
import { manifest as slack } from './slack';
import { manifest as github } from './github';
import { manifest as linear } from './linear';
import { manifest as notion } from './notion';
import { manifest as gdrive } from './google-drive';
import { manifest as gcal } from './google-calendar';
import { manifest as airtable } from './airtable';
import { manifest as resend } from './resend';
import { manifest as firecrawl } from './firecrawl';

export const ALL_INTEGRATIONS: IntegrationManifest[] = [
  sandbox,        // ← Buck's own runtime, always-on, listed first
  github,
  gmail,
  slack,
  linear,
  notion,
  gdrive,
  gcal,
  airtable,
  resend,
  firecrawl,
];

export const INTEGRATIONS_BY_SERVICE: Record<string, IntegrationManifest> = Object.fromEntries(
  ALL_INTEGRATIONS.map((m) => [m.service, m])
);

export function getIntegration(service: string): IntegrationManifest | undefined {
  return INTEGRATIONS_BY_SERVICE[service];
}