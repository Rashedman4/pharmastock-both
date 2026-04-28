import nodemailer from "nodemailer";

// Function to send an email
export const sendEmail = async (to: string, subject: string, code: string) => {
  // Create the transport configuration
  const transport = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const plainText = `Hello,

Here is your verification code:

${code}

If you did not request this code, feel free to ignore this email.

Best regards,  
Bio Pharma Stock Support Team`;

  const htmlText = `
    <div style="font-family: Arial, sans-serif; font-size: 16px; color: #333;">
      <p>Hello,</p>
      <p>Here is your verification code:</p>
      <p style="font-size: 20px; font-weight: bold; color: #2c3e50; margin: 10px 0;">${code}</p>
      <p>If you did not request this code, feel free to ignore this email.</p>
      <br />
      <p style="color: #888;">Best regards,<br/>Bio Pharma Stock Support Team</p>
    </div>
  `;

  try {
    await transport.sendMail({
      from: process.env.EMAIL_USER_SENDER,
      to,
      subject,
      text: plainText,
      html: htmlText,
    });

    console.log(`Email sent successfully to ${to}`);
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error);
    throw new Error("Failed to send email");
  }
};
const escapeHtml = (s: string) =>
  s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

export const sendEmailNotification = async (
  to: string,
  subject: string,
  message: string,
  name?: string, // ✅ add name
) => {
  const transport = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const displayName = name?.trim() ? name.trim() : null;

  const plainText = `${displayName ? `Hello ${displayName},` : "Hello,"}

${message}

Sent to: ${to}

If you did not request this email, feel free to ignore it.

Best regards,  
Bio Pharma Stock Support Team`;

  const safeMessageHtml = escapeHtml(message).replaceAll("\n", "<br/>");

  const htmlText = `
    <div style="font-family: Arial, sans-serif; font-size: 16px; color: #222; background:#f5f7fb; padding: 18px;">
      <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e9edf5;">
        
        <div style="padding: 16px 20px; background: linear-gradient(135deg,#061a3a,#0b3b8f); color: #fff;">
          <div style="font-size: 14px; opacity: 0.9;">Bio Pharma Stock</div>
          <div style="margin-top: 6px; font-size: 18px; font-weight: 700;">${escapeHtml(subject)}</div>
        </div>

        <div style="padding: 18px 20px;">
          <p style="margin: 0 0 12px; line-height: 1.6;">
            ${displayName ? `Hello ${escapeHtml(displayName)},` : "Hello,"}
          </p>

          <p style="margin: 0; line-height: 1.7; color:#333;">
            ${safeMessageHtml}
          </p>

          <div style="margin-top: 14px; padding-top: 12px; border-top: 1px solid #eef2f8;">
            <div style="font-size: 13px; color: #666;">
              <strong>Sent to:</strong> ${escapeHtml(to)}
            </div>
            <div style="margin-top: 10px; font-size: 13px; color: #666;">
              If you did not request this email, feel free to ignore it.
            </div>
          </div>

          <div style="margin-top: 16px; color: #888; font-size: 13px; line-height: 1.5;">
            Best regards,<br/>Bio Pharma Stock Support Team
          </div>
        </div>
      </div>
    </div>
  `;

  try {
    await transport.sendMail({
      from: process.env.EMAIL_USER_SENDER,
      to,
      subject,
      text: plainText,
      html: htmlText,
    });

    console.log(`Email sent successfully to ${to}`);
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error);
    throw new Error("Failed to send email");
  }
};
