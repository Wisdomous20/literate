import { EMAIL_FROM, sendEmail } from "@/service/notification/emailTransporter";

interface SendInvoiceEmailParams {
  to: string;
  invoiceNumber: string;
  planName: string;
  amount: string;
  currency: string;
  issuedAt: Date;
}

export async function sendInvoiceEmail({
  to,
  invoiceNumber,
  planName,
  amount,
  currency,
  issuedAt,
}: SendInvoiceEmailParams): Promise<void> {
  const issuedLabel = issuedAt.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; color: #18181b;">
      <h2 style="color: #31318A; margin: 0 0 12px;">Your Literate invoice</h2>
      <p style="margin: 0 0 16px; line-height: 1.6;">
        Thank you for your payment. Your invoice details are below.
      </p>
      <div style="border: 1px solid #E5E7EB; border-radius: 12px; padding: 18px; margin: 20px 0; background: #FAFAFF;">
        <p style="margin: 0 0 8px;"><strong>Invoice:</strong> ${invoiceNumber}</p>
        <p style="margin: 0 0 8px;"><strong>Plan:</strong> ${planName}</p>
        <p style="margin: 0 0 8px;"><strong>Date:</strong> ${issuedLabel}</p>
        <p style="margin: 0;"><strong>Total paid:</strong> ${currency} ${amount}</p>
      </div>
      <p style="margin: 0; line-height: 1.6; font-size: 13px; color: #71717a;">
        If you have questions about this invoice, reply to this email or contact support.
      </p>
    </div>
  `;

  await sendEmail({
    from: EMAIL_FROM,
    to,
    subject: `Literate invoice ${invoiceNumber}`,
    html,
  });
}
