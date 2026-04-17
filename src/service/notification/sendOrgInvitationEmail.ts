import transporter, { EMAIL_FROM } from "@/service/notification/emailTransporter";

interface SendOrgInvitationEmailParams {
  to: string;
  inviteeFirstName: string;
  organizationName: string;
  invitedByName: string;
  acceptUrl: string;
  expiresAt: Date;
}

export async function sendOrgInvitationEmail({
  to,
  inviteeFirstName,
  organizationName,
  invitedByName,
  acceptUrl,
  expiresAt,
}: SendOrgInvitationEmailParams): Promise<void> {
  const expiresLabel = expiresAt.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; color: #18181b;">
      <h2 style="color: #31318A; margin: 0 0 12px;">You're invited to join ${organizationName}</h2>
      <p style="margin: 0 0 16px; line-height: 1.6;">
        Hi ${inviteeFirstName},
      </p>
      <p style="margin: 0 0 16px; line-height: 1.6;">
        ${invitedByName} has invited you to join <strong>${organizationName}</strong> on Literate.
        Click the button below to accept the invitation and set your password.
      </p>
      <p style="margin: 24px 0;">
        <a
          href="${acceptUrl}"
          style="display: inline-block; padding: 12px 28px; background-color: #6666FF; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600;"
        >
          Accept invitation
        </a>
      </p>
      <p style="margin: 0 0 8px; line-height: 1.6; font-size: 14px; color: #6B7DB3;">
        Or paste this link into your browser:
      </p>
      <p style="margin: 0 0 24px; line-height: 1.6; font-size: 13px; word-break: break-all; color: #6B7DB3;">
        ${acceptUrl}
      </p>
      <p style="margin: 0; line-height: 1.6; font-size: 13px; color: #71717a;">
        This invitation expires on <strong>${expiresLabel}</strong>. If you weren't expecting this, you can safely ignore this email.
      </p>
    </div>
  `;

  await transporter.sendMail({
    from: EMAIL_FROM,
    to,
    subject: `Invitation to join ${organizationName} on Literate`,
    html,
  });
}
