import { randomUUID } from "crypto";
import { xenditRequest } from "@/lib/xendit";
import { buildApplicationUrl } from "@/lib/applicationUrl";

type XenditSubscriptionSessionInput = {
  userId: string;
  userName: string;
  userEmail: string;
  organizationId: string;
  xenditCustomerId?: string | null;
  amount: number;
  currency: string;
  description: string;
  metadata: Record<string, string>;
  anchorDate?: Date;
  immediatePayment: boolean;
};

type XenditSubscriptionSession = {
  recurringPlanId: string;
  paymentLinkUrl: string;
  customerId: string | null;
};

export async function createXenditSubscriptionSession(
  input: XenditSubscriptionSessionInput,
): Promise<XenditSubscriptionSession> {
  const uniqueId = randomUUID().replace(/-/g, "");
  const referenceId = `lit-sub-${uniqueId}`;
  const returnUrls = getHttpsReturnUrls();

  const session = await xenditRequest<{
    id?: string;
    payment_session_id?: string;
    recurring_plan_id?: string;
    payment_link_url?: string;
    customer_id?: string;
  }>("/sessions", "POST", {
    reference_id: referenceId,
    ...(input.xenditCustomerId
      ? { customer_id: input.xenditCustomerId }
      : {
          customer: {
            reference_id: input.userId,
            type: "INDIVIDUAL",
            individual_detail: { given_names: input.userName || "User" },
            email: input.userEmail,
          },
        }),
    session_type: "PAY",
    allow_save_payment_method: "FORCED",
    payment_method_configuration: {
      reference_id: `lit-pmc-${uniqueId}`,
    },
    channel_properties: {
      cards: {
        card_on_file_type: "RECURRING",
        recurring_configuration: {
          recurring_expiry: getRecurringExpiryDate(),
          recurring_frequency: 365,
        },
      },
    },
    currency: input.currency,
    amount: input.amount,
    mode: "PAYMENT_LINK",
    country: "PH",
    locale: "en",
    description: input.description,
    ...returnUrls,
    metadata: {
      ...input.metadata,
      checkoutReferenceId: referenceId,
    },
  });

  const paymentSessionId = session.payment_session_id ?? session.id;
  if (!paymentSessionId || !session.payment_link_url) {
    throw new Error("Xendit did not return a payment link");
  }

  return {
    recurringPlanId: paymentSessionId,
    paymentLinkUrl: session.payment_link_url,
    customerId: session.customer_id ?? input.xenditCustomerId ?? null,
  };
}

function getRecurringExpiryDate(): string {
  const expiry = new Date();
  expiry.setFullYear(expiry.getFullYear() + 10);

  return expiry.toISOString().slice(0, 10);
}

function getHttpsReturnUrls():
  | { success_return_url: string; cancel_return_url: string }
  | Record<string, never> {
  const successUrl = buildApplicationUrl("/dashboard/subscription?subscription=success");
  const cancelUrl = buildApplicationUrl("/dashboard/subscription?subscription=failed");

  if (!successUrl.startsWith("https://") || !cancelUrl.startsWith("https://")) {
    return {};
  }

  return {
    success_return_url: successUrl,
    cancel_return_url: cancelUrl,
  };
}
