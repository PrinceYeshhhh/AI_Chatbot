import crypto from 'crypto';

const ENCRYPTION_KEY = process.env['ENCRYPTION_KEY'] || 'default_secret_key_32bytes!'; // 32 bytes for AES-256
const IV_LENGTH = 16; // AES block size

export function encryptAES(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  return iv.toString('base64') + ':' + encrypted;
}

export function decryptAES(encrypted: string): string {
  const parts = encrypted.split(':');
  if (parts.length !== 2) {
    throw new Error('Invalid encrypted format');
  }
  const ivBase64 = parts[0]!;
  const encryptedText = parts[1]!;
  const iv = Buffer.from(ivBase64, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encryptedText, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
} 