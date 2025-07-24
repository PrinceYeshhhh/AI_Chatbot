import { useState, useEffect } from "react";

export function useEncryptionKey(password: string, salt: string) {
  const [key, setKey] = useState<CryptoKey | null>(null);

  useEffect(() => {
    if (!password || !salt) return;
    (async () => {
      const enc = new TextEncoder();
      const keyMaterial = await window.crypto.subtle.importKey(
        "raw", enc.encode(password), { name: "PBKDF2" }, false, ["deriveKey"]
      );
      const derivedKey = await window.crypto.subtle.deriveKey(
        {
          name: "PBKDF2",
          salt: enc.encode(salt),
          iterations: 100_000,
          hash: "SHA-256"
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
      );
      setKey(derivedKey);
    })();
  }, [password, salt]);

  return key;
} 