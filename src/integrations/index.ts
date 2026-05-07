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
  /** Function name Buck will call. e.g. "github.search_issues" */
  name: string;
  description: string;
  /** JSON schema for the tool's arguments. */
  parameters: Record<string, unknown>;
  /** True if this tool is destructive — surfaces in approval gate config. */
  destructive?: boolean;
}

export interface IntegrationManifest {
  service: string;            // 'github', 'slack', etc.
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
  setup_instructions: string;  // markdown
  tools: ToolSpec[];
  /** Color hint for the UI badge (CSS color). */
  badge_color?: string;
}

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
  gmail,
  slack,
  github,
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
