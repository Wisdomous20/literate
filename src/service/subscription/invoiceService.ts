import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import {
  encryptBillingValue,
  getBillingEncryptionKeyVersion,
} from "@/lib/billingEncryption";
import { sendInvoiceEmail } from "@/service/notification/sendInvoiceEmail";

interface CreateInvoiceInput {
  subscriptionId: string;
  providerInvoiceId: string;
  providerPaymentId?: string | null;
  providerPayload?: unknown;
  issuedAt?: Date;
}

export async function createInvoiceAndSendEmail(input: CreateInvoiceInput) {
  const existing = await prisma.invoice.findFirst({
    where: { providerInvoiceId: input.providerInvoiceId },
  });

  if (existing) {
    return existing;
  }

  const subscription = await prisma.subscription.findUnique({
    where: { id: input.subscriptionId },
    include: {
      plan: true,
      organization: {
        include: {
          members: {
            where: { role: "OWNER" },
            include: {
              user: {
                select: {
                  email: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
            take: 1,
          },
        },
      },
    },
  });

  if (!subscription) {
    throw new Error("Subscription not found for invoice creation.");
  }

  const issuedAt = input.issuedAt ?? new Date();
  const owner = subscription.organization.members[0]?.user ?? null;
  const recipientEmail = owner?.email ?? null;
  const amount = subscription.priceAmountSnapshot;
  const currency = subscription.currencySnapshot;
  const encryptionKeyVersion = getBillingEncryptionKeyVersion();
  const billingSnapshot = {
    organizationId: subscription.organizationId,
    organizationName: subscription.organization.name,
    organizationType: subscription.organization.type,
    planCode: subscription.plan.code,
    planName: subscription.plan.name,
    recipientEmail,
    recipientName:
      [owner?.firstName, owner?.lastName].filter(Boolean).join(" ").trim() ||
      null,
    issuedAt: issuedAt.toISOString(),
  };

  let billingSnapshotEncrypted: string | null = null;
  let recipientEmailEncrypted: string | null = null;
  let providerPayloadEncrypted: string | null = null;

  try {
    billingSnapshotEncrypted = encryptBillingValue(billingSnapshot);
    recipientEmailEncrypted = encryptBillingValue(recipientEmail);
    providerPayloadEncrypted = encryptBillingValue(input.providerPayload);
  } catch (error) {
    console.error("Failed to encrypt billing invoice data:", error);
  }

  const invoice = await prisma.invoice.create({
    data: {
      subscriptionId: subscription.id,
      invoiceNumber: createInvoiceNumber(),
      status: "PAID",
      currency,
      subtotalAmount: amount,
      taxAmount: 0,
      totalAmount: amount,
      amountPaid: amount,
      billingSnapshotEncrypted,
      billingSnapshotKeyVersion: billingSnapshotEncrypted ? encryptionKeyVersion : null,
      recipientEmailEncrypted,
      recipientEmailKeyVersion: recipientEmailEncrypted ? encryptionKeyVersion : null,
      providerInvoiceId: input.providerInvoiceId,
      issuedAt,
      paidAt: issuedAt,
      transactions: {
        create: {
          provider: "XENDIT",
          providerPaymentId: input.providerPaymentId ?? null,
          status: "SUCCEEDED",
          amount,
          currency,
          providerPayloadEncrypted,
          providerPayloadKeyVersion: providerPayloadEncrypted
            ? encryptionKeyVersion
            : null,
        },
      },
    },
  });

  if (!recipientEmail) {
    return prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        emailStatus: "FAILED",
        emailFailureReason: "No invoice recipient email found.",
      },
    });
  }

  try {
    await sendInvoiceEmail({
      to: recipientEmail,
      invoiceNumber: invoice.invoiceNumber,
      planName: subscription.plan.name,
      amount: amount.toString(),
      currency,
      issuedAt,
    });

    return prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        emailStatus: "SENT",
        emailSentAt: new Date(),
        emailFailureReason: null,
      },
    });
  } catch (error) {
    console.error("Failed to send invoice email:", error);
    return prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        emailStatus: "FAILED",
        emailFailureReason:
          error instanceof Error ? error.message : "Invoice email failed.",
      },
    });
  }
}

function createInvoiceNumber(): string {
  const datePart = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const randomPart = randomUUID().slice(0, 8).toUpperCase();
  return `INV-${datePart}-${randomPart}`;
}
