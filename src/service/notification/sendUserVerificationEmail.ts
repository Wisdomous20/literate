import nodemailer from 'nodemailer';

interface SendUserVerificationEmailParams {
  to: string;
  userName: string;
  userId: string;
  verificationToken: string;
  color?: string;
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendUserVerificationEmail({
  to,
  userName,
  userId,
  verificationToken,
  color = '#4F46E5',
}: SendUserVerificationEmailParams): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const verificationUrl = `${baseUrl}/api/auth/verify?token=${verificationToken}&userId=${userId}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td align="center" style="padding: 40px 0;">
              <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <tr>
                  <td style="padding: 40px 40px 20px 40px; text-align: center;">
                    <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #18181b;">
                      Welcome to Literate!
                    </h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 0 40px 20px 40px; text-align: center;">
                    <p style="margin: 0; font-size: 16px; line-height: 24px; color: #52525b;">
                      Hi ${userName},
                    </p>
                    <p style="margin: 16px 0 0 0; font-size: 16px; line-height: 24px; color: #52525b;">
                      Thank you for signing up! Please verify your email address by clicking the button below.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px 40px 30px 40px; text-align: center;">
                    <a href="${verificationUrl}" 
                       style="display: inline-block; padding: 14px 32px; background-color: ${color}; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 6px;">
                      Verify Email Address
                    </a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 0 40px 20px 40px; text-align: center;">
                    <p style="margin: 0; font-size: 14px; line-height: 20px; color: #71717a;">
                      Or copy and paste this link into your browser:
                    </p>
                    <p style="margin: 8px 0 0 0; font-size: 14px; line-height: 20px; color: ${color}; word-break: break-all;">
                      ${verificationUrl}
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px 40px 40px 40px; text-align: center; border-top: 1px solid #e4e4e7;">
                    <p style="margin: 0; font-size: 12px; line-height: 18px; color: #a1a1aa;">
                      This verification link will expire in ${process.env.VERIFICATION_WINDOW_MINUTES || 15} minutes.
                    </p>
                    <p style="margin: 8px 0 0 0; font-size: 12px; line-height: 18px; color: #a1a1aa;">
                      If you didn't create an account, you can safely ignore this email.
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

  const mailOptions = {
    from: process.env.SMTP_FROM || '"Literate" <noreply@literate.com>',
    to,
    subject: 'Verify Your Email - Literate',
    html,
  };

  await transporter.sendMail(mailOptions);
}