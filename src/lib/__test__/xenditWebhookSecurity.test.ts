import { describe, expect, it } from "vitest";
import {
  createXenditWebhookDeliveryId,
  verifyXenditWebhookToken,
} from "../xenditWebhookSecurity";

describe("verifyXenditWebhookToken", () => {
  it("fails closed when the configured token or callback token is missing", () => {
    expect(verifyXenditWebhookToken(null, "configured-secret")).toBe(false);
    expect(verifyXenditWebhookToken("callback-secret", undefined)).toBe(false);
    expect(verifyXenditWebhookToken("", "configured-secret")).toBe(false);
  });

  it("accepts only the configured callback token", () => {
    expect(verifyXenditWebhookToken("configured-secret", "configured-secret")).toBe(true);
    expect(verifyXenditWebhookToken("configured-secreu", "configured-secret")).toBe(false);
    expect(verifyXenditWebhookToken("short", "configured-secret")).toBe(false);
  });
});

describe("createXenditWebhookDeliveryId", () => {
  it("is deterministic for retries and changes when the provider payload changes", () => {
    const payload = '{"event":"recurring.cycle.succeeded","data":{"plan_id":"p-1"}}';

    expect(createXenditWebhookDeliveryId(payload)).toBe(
      createXenditWebhookDeliveryId(payload),
    );
    expect(createXenditWebhookDeliveryId(payload)).not.toBe(
      createXenditWebhookDeliveryId(
        '{"event":"recurring.cycle.succeeded","data":{"plan_id":"p-2"}}',
      ),
    );
  });
});
