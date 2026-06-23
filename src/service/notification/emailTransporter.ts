import nodemailer from "nodemailer";

const emailUser = process.env.EMAIL_USER?.trim();
const emailPass = process.env.EMAIL_PASS?.trim();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: emailUser,
    pass: emailPass,
  },
  connectionTimeout: 10_000,
  greetingTimeout: 10_000,
  socketTimeout: 20_000,
});

export const EMAIL_FROM =
  process.env.SMTP_FROM || `"Literate" <${emailUser}>`;

const TRANSIENT_SMTP_ERRORS = new Set([
  "ECONNECTION",
  "ECONNRESET",
  "EAI_AGAIN",
  "ESOCKET",
  "ETIMEDOUT",
]);

function isTransientSmtpError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    TRANSIENT_SMTP_ERRORS.has(String((error as { code?: unknown }).code))
  );
}

function assertEmailConfiguration(): void {
  if (!emailUser || !emailPass) {
    throw new Error("Email transport is not configured.");
  }
}

export async function sendEmail(
  options: Parameters<typeof transporter.sendMail>[0],
) {
  assertEmailConfiguration();

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      return await transporter.sendMail(options);
    } catch (error) {
      if (attempt === 2 || !isTransientSmtpError(error)) throw error;
      await new Promise((resolve) => setTimeout(resolve, attempt * 400));
    }
  }

  throw new Error("Email delivery failed.");
}

export default transporter;
