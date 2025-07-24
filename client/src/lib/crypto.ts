export async function encryptData(key: CryptoKey, data: string) {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const ciphertext = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(data)
  );
  return { iv: Array.from(iv), ciphertext: Array.from(new Uint8Array(ciphertext)) };
}

export async function decryptData(key: CryptoKey, encrypted: { iv: number[]; ciphertext: number[] }) {
  const dec = new TextDecoder();
  const plain = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: new Uint8Array(encrypted.iv) },
    key,
    new Uint8Array(encrypted.ciphertext)
  );
  return dec.decode(plain);
} 