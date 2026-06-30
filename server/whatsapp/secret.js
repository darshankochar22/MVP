// Per-row secret encryption for WhatsApp credentials (Meta access token / Wati API key).
// Mirrors server/ai/keyStore.js: encrypt at rest with Electron safeStorage, fall back to
// plaintext ONLY when safeStorage is unavailable (e.g. tests / non-Electron). Encrypted
// values are tagged with an "enc:v1:" prefix so we can distinguish them from legacy
// plaintext rows written before encryption existed.

const PREFIX = 'enc:v1:';

function safeStorage() {
  try {
    const e = require('electron');
    if (e && e.safeStorage && e.safeStorage.isEncryptionAvailable()) return e.safeStorage;
  } catch {
    /* not running under Electron */
  }
  return null;
}

// Encrypt a plaintext secret for storage. Returns the tagged ciphertext, or the raw
// value when encryption is unavailable (so tests still round-trip).
function encryptSecret(plain) {
  if (!plain) return '';
  const ss = safeStorage();
  if (!ss) return plain;
  try {
    return PREFIX + ss.encryptString(plain).toString('base64');
  } catch {
    return plain;
  }
}

// Decrypt a stored secret. Legacy (untagged) plaintext is returned as-is.
function decryptSecret(stored) {
  if (!stored) return '';
  if (!stored.startsWith(PREFIX)) return stored; // legacy plaintext row
  const ss = safeStorage();
  if (!ss) return '';
  try {
    return ss.decryptString(Buffer.from(stored.slice(PREFIX.length), 'base64'));
  } catch {
    return '';
  }
}

// Non-secret preview for the renderer (never the raw value).
function maskSecret(plain) {
  if (!plain) return null;
  return plain.length <= 11 ? `${plain.slice(0, 3)}…` : `${plain.slice(0, 6)}…${plain.slice(-4)}`;
}

module.exports = { encryptSecret, decryptSecret, maskSecret, ENC_PREFIX: PREFIX };
