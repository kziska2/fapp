import { generateSalt, deriveKey, DEFAULT_KDF_PARAMS } from './kdf.js';
import { encryptBytes, decryptBytes } from './cipher.js';

export class WrongPassphraseError extends Error {
  constructor() {
    super("That passphrase didn't work.");
    this.name = 'WrongPassphraseError';
  }
}

async function compress(bytes) {
  const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream('gzip'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function decompress(bytes) {
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

// Compress-then-encrypt, matching docs/SECURITY.md: compression just keeps the
// file small, encryption is what makes it unreadable.
export async function lockBytes(dbBytes, key) {
  const compressed = await compress(dbBytes);
  const { iv, ciphertext } = await encryptBytes(compressed, key);
  return { iv, ciphertext };
}

export async function unlockBytes(iv, ciphertext, key) {
  let compressed;
  try {
    compressed = await decryptBytes(ciphertext, key, iv);
  } catch {
    // AES-GCM authentication failed — wrong passphrase (or corrupted data).
    // Never distinguish the two in the message: telling an attacker "the file
    // is fine, your guess was wrong" vs. "the file is corrupt" leaks information.
    throw new WrongPassphraseError();
  }
  return decompress(compressed);
}

// First launch: no vault exists yet. Creates a fresh salt + key and locks the
// given (empty) database bytes.
export async function createVault(passphrase, dbBytes) {
  const salt = generateSalt();
  const kdfParams = DEFAULT_KDF_PARAMS;
  const key = await deriveKey(passphrase, salt, kdfParams);
  const { iv, ciphertext } = await lockBytes(dbBytes, key);
  return { salt, kdfParams, iv, ciphertext, key };
}

// Later launches: re-derive the key from the stored salt/params and attempt to
// unlock the stored ciphertext.
export async function openVault(passphrase, { salt, kdfParams, iv, ciphertext }) {
  const key = await deriveKey(passphrase, salt, kdfParams);
  const dbBytes = await unlockBytes(iv, ciphertext, key);
  return { key, dbBytes };
}
