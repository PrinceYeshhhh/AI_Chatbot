import { encrypt, decrypt } from '../security/encryption';

process.env['ENCRYPTION_KEY'] = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

describe('AES-256-CBC encryption/decryption', () => {
  it('should encrypt and decrypt text correctly', () => {
    const data = 'Sensitive backend message';
    const encrypted = encrypt(data);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(data);
  });
}); 