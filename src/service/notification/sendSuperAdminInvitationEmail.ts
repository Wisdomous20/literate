import { EMAIL_FROM, sendEmail } from "@/service/notification/emailTransporter";

interface SendSuperAdminInvitationEmailParams {
  to: string;
  invitedByName: string;
  acceptUrl: string;
  expiresAt: Date;
}

export async function sendSuperAdminInvitationEmail({
  to,
  invitedByName,
  acceptUrl,
  expiresAt,
}: SendSuperAdminInvitationEmailParams): Promise<void> {
  const expiresLabel = expiresAt.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; color: #323743;">
      <h2 style="color: #0C2D57; margin: 0 0 12px;">You're invited to administer LiteRate</h2>
      <p style="margin: 0 0 16px; line-height: 1.6;">
        Hello,
      </p>
      <p style="margin: 0 0 16px; line-height: 1.6;">
        ${invitedByName} invited you to join LiteRate as a super admin. Use the button below to set your password and open the platform admin workspace.
      </p>
      <p style="margin: 24px 0;">
        <a
          href="${acceptUrl}"
          style="display: inline-block; padding: 12px 28px; background-color: #0C2D57; color: #ffffff; text-decoration: none; border-radius: 14px; font-weight: 600;"
        >
          Set password
        </a>
      </p>
      <p style="margin: 0 0 8px; line-height: 1.6; font-size: 14px; color: #575E6B;">
        Or paste this link into your browser:
      </p>
      <p style="margin: 0 0 24px; line-height: 1.6; font-size: 13px; word-break: break-all; color: #575E6B;">
        ${acceptUrl}
      </p>
      <p style="margin: 0; line-height: 1.6; font-size: 13px; color: #575E6B;">
        This invitation expires on <strong>${expiresLabel}</strong>. If you weren't expecting this, you can safely ignore this email.
      </p>
    </div>
  `;

  await sendEmail({
    from: EMAIL_FROM,
    to,
    subject: "Invitation to administer LiteRate",
    html,
  });
}
