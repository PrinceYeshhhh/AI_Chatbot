# Security Module: Encryption

## AES-256 Encryption Utility

- Uses Node.js `crypto` for AES-256-CBC encryption.
- Key is loaded from the `ENCRYPTION_KEY` environment variable (must be 32 bytes, hex-encoded).
- IV is randomly generated per encryption.

### Usage
```ts
import { encrypt, decrypt } from './encryption';
const ciphertext = encrypt('my secret');
const plaintext = decrypt(ciphertext);
```

## Key Management
- Store `ENCRYPTION_KEY` securely (e.g., environment secrets, KMS, or vault).
- Never commit keys to source control.
- Rotate keys periodically. 

## Security Logs & Alerting
- All high-risk events (failed logins, file abuse, query spikes) are logged to the `security_logs` table.
- Use alerting logic to notify admins on critical events. 