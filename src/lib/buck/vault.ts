// =============================================================================
// Buck — vault
// =============================================================================
// Encrypts integration secrets at rest. Uses AES-256-GCM with a key from
// VAULT_ENCRYPTION_KEY (base64-encoded 32 bytes). Each secret payload is a JSON
// object — typically {ENV_VAR: value, ...} — encrypted as a single blob.
//
// Format on disk: base64( iv (12 bytes) || authTag (16 bytes) || ciphertext )
// =============================================================================

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALG = 'aes-256-gcm';
const IV_LEN = 12;
const TAG_LEN = 16;

function getKey(): Buffer {
  const raw = process.env.VAULT_ENCRYPTION_KEY;
  if (!raw) throw new Error('VAULT_ENCRYPTION_KEY not configured');
  const key = Buffer.from(raw, 'base64');
  if (key.length !== 32) {
    throw new Error(
      `VAULT_ENCRYPTION_KEY must decode to 32 bytes (got ${key.length}). ` +
        `Generate with: openssl rand -base64 32`
    );
  }
  return key;
}

export function encryptSecrets(payload: Record<string, string>): string {
  const key = getKey();
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALG, key, iv);
  const plaintext = Buffer.from(JSON.stringify(payload), 'utf8');
  const enc = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString('base64');
}

export function decryptSecrets(blob: string): Record<string, string> {
  const key = getKey();
  const buf = Buffer.from(blob, 'base64');
  if (buf.length < IV_LEN + TAG_LEN) {
    throw new Error('vault blob too short');
  }
  const iv = buf.subarray(0, IV_LEN);
  const tag = buf.subarray(IV_LEN, IV_LEN + TAG_LEN);
  const ciphertext = buf.subarray(IV_LEN + TAG_LEN);
  const decipher = createDecipheriv(ALG, key, iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return JSON.parse(dec.toString('utf8'));
}
