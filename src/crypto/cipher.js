// AES-256-GCM via the browser's native Web Crypto — no hand-rolled crypto (docs/SECURITY.md rule 5).

export async function encryptBytes(bytes, key) {
  // A fresh random IV every encrypt call, per AES-GCM's requirement — never reuse
  // an IV with the same key, or the confidentiality guarantee breaks.
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, bytes);
  return { iv, ciphertext: new Uint8Array(ciphertext) };
}

// Throws (DOMException, "OperationError") if the key is wrong or the bytes were
// tampered with — GCM's built-in authentication tag makes that check automatic.
export async function decryptBytes(ciphertext, key, iv) {
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
  return new Uint8Array(plain);
}
