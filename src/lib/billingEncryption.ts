import { createCipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

function getEncryptionKey(): Buffer | null {
  const rawKey = process.env.BILLING_ENCRYPTION_KEY?.trim();
  if (!rawKey) return null;

  const encoding = rawKey.length === 64 ? "hex" : "base64";
  const key = Buffer.from(rawKey, encoding);

  if (key.length !== 32) {
    throw new Error("BILLING_ENCRYPTION_KEY must decode to 32 bytes.");
  }

  return key;
}

export function getBillingEncryptionKeyVersion(): string | null {
  return process.env.BILLING_ENCRYPTION_KEY_VERSION?.trim() || "v1";
}

export function encryptBillingValue(value: unknown): string | null {
  if (value === undefined || value === null) return null;

  const key = getEncryptionKey();
  if (!key) return null;

  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const plaintext =
    typeof value === "string" ? value : JSON.stringify(value);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [
    ALGORITHM,
    iv.toString("base64url"),
    authTag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(":");
}
