import dotenv from "dotenv";
dotenv.config();
import { Resend } from "resend";


// Add debug log
console.log({
  RESEND_API_KEY: process.env.RESEND_API_KEY ? "Set" : "Not Set",
  EMAIL_FROM: process.env.EMAIL_FROM,
  ADMIN_EMAIL: process.env.ADMIN_EMAIL,
});

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send an email using Resend
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - Email HTML content
 * @param {string} options.from - Sender email (optional)
 * @returns {Promise} - Resend API response
 */
export const sendEmail = async ({
  to,
  subject,
  html,
  from = process.env.EMAIL_FROM || "noreply@controlshift.ae",
  attachments = [],
}) => {
  try {
    const { data, error } = await resend.emails.send({
      from,
      to: [to],
      subject,
      html,
      attachments,
    });

    if (error) {
      console.error("Email sending failed:", error);
      return { success: false, error };
    }

    console.log("Email sent successfully:", data);
    return { success: true, data };
  } catch (error) {
    console.error("Email sending error:", error);
    return { success: false, error: error.message };
  }
};



