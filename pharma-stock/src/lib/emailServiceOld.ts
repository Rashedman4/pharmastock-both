import nodemailer from "nodemailer";

// Function to send an email
export const sendEmail = async (to: string, subject: string, text: string) => {
  // Create the transport configuration
  const transport = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: 465, // or 465 for secure
    secure: true, // true for port 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // Send the email
  text =
    "Hello" +
    "\n" +
    text +
    "\n" +
    `If you did not request this code, feel free to ignore this email.

    Best regards,  
    Bio Pharma Stock Support Team`;
  try {
    await transport.sendMail({
      from: process.env.EMAIL_USER_SENDER, // Use a consistent 'from' address
      to,
      subject,
      text,
    });

    console.log(`Email sent successfully to ${to}`);
  } catch (error) {
    console.error(`Failed to send email to ${error}: `);
    throw new Error("Failed to send email");
  }
};
