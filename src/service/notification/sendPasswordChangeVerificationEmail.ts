import transporter, { EMAIL_FROM } from "@/service/notification/emailTransporter";

interface SendPasswordChangeVerificationEmailParams {
  to: string;
  userName: string;
  verificationCode: string;
}

export async function sendPasswordChangeVerificationEmail({
  to,
  userName,
  verificationCode,
}: SendPasswordChangeVerificationEmailParams): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Change Verification</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td align="center" style="padding: 40px 0;">
              <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <tr>
                  <td style="padding: 40px 40px 20px 40px; text-align: center;">
                    <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #18181b;">
                      Password Change Request
                    </h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 0 40px 20px 40px; text-align: center;">
                    <p style="margin: 0; font-size: 16px; line-height: 24px; color: #52525b;">
                      Hi ${userName},
                    </p>
                    <p style="margin: 16px 0 0 0; font-size: 16px; line-height: 24px; color: #52525b;">
                      We received a request to change your password. Use the code below to verify this action.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px 40px 30px 40px; text-align: center;">
                    <div style="display: inline-block; padding: 16px 40px; background-color: #f4f4f5; border-radius: 8px; border: 2px dashed #d4d4d8;">
                      <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #4F46E5; font-family: 'Courier New', monospace;">
                        ${verificationCode}
                      </span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 0 40px 20px 40px; text-align: center;">
                    <p style="margin: 0; font-size: 14px; line-height: 20px; color: #71717a;">
                      Enter this code in the app to confirm your password change.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px 40px 40px 40px; text-align: center; border-top: 1px solid #e4e4e7;">
                    <p style="margin: 0; font-size: 12px; line-height: 18px; color: #a1a1aa;">
                      This code will expire in ${process.env.VERIFICATION_WINDOW_MINUTES || 15} minutes.
                    </p>
                    <p style="margin: 8px 0 0 0; font-size: 12px; line-height: 18px; color: #a1a1aa;">
                      If you didn't request this change, please secure your account immediately.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  await transporter.sendMail({
    from: EMAIL_FROM,
    to,
    subject: "Password Change Verification Code - Literate",
    html,
  });
}