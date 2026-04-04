import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const EMAIL_FROM =
  process.env.SMTP_FROM || `"Literate" <${process.env.EMAIL_USER}>`;

export default transporter;