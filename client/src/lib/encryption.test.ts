import { test, expect } from 'vitest';
import { encryptData, decryptData } from './crypto';

test('AES-GCM encryption/decryption', async () => {
  // Generate a test key
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw', enc.encode('test-password'), { name: 'PBKDF2' }, false, ['deriveKey']
  );
  const key = await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: enc.encode('test-salt'),
      iterations: 100_000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
  const data = 'Sensitive message';
  const encrypted = await encryptData(key, data);
  const decrypted = await decryptData(key, encrypted);
  expect(decrypted).toBe(data);
}); 