import { argon2id } from 'hash-wasm';

// Deliberately slow + memory-hungry (docs/SECURITY.md) so a stolen locked file
// resists brute-forcing the passphrase. Stored alongside the salt (not secret)
// so a future tuning change doesn't break decrypting vaults created today.
export const DEFAULT_KDF_PARAMS = {
  iterations: 3,
  parallelism: 1,
  memorySize: 65536, // KiB, i.e. 64 MiB
  hashLength: 32, // bytes -> 256-bit AES key
};

export function generateSalt() {
  return crypto.getRandomValues(new Uint8Array(16));
}

export async function deriveKey(passphrase, salt, kdfParams = DEFAULT_KDF_PARAMS) {
  const raw = await argon2id({
    password: passphrase,
    salt,
    parallelism: kdfParams.parallelism,
    iterations: kdfParams.iterations,
    memorySize: kdfParams.memorySize,
    hashLength: kdfParams.hashLength,
    outputType: 'binary',
  });
  return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
}
