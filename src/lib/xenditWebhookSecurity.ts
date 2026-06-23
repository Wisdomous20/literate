import { createHash, timingSafeEqual } from "node:crypto";

function normalizeSecret(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

export function verifyXenditWebhookToken(
  receivedToken: string | null | undefined,
  configuredToken = process.env.XENDIT_WEBHOOK_TOKEN,
): boolean {
  const received = normalizeSecret(receivedToken);
  const expected = normalizeSecret(configuredToken);
  if (!received || !expected) return false;

  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);
  if (receivedBuffer.length !== expectedBuffer.length) return false;

  return timingSafeEqual(receivedBuffer, expectedBuffer);
}

export function createXenditWebhookDeliveryId(rawBody: string): string {
  return createHash("sha256").update(rawBody).digest("hex");
}
