import { sendEmail } from "../lib/resendMail.mjs";

export const handleQuoteForm = async (req, res) => {
  try {
    const { name, email, mobileNumber, message } = req.body;
    const file = req.file;

    let attachments = [];

    if (file) {
      attachments.push({
        filename: file.originalname,
        content: file.buffer.toString("base64"),
      });
    }

    const emailHtml = `
      <h2>New Quote Request</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${mobileNumber}</p>
      <p><strong>Message:</strong> ${message}</p>
    `;

    const result = await sendEmail({
      to: process.env.ADMIN_EMAIL,
      subject: `Quote Request from ${name}`,
      html: emailHtml,
      attachments,
    });

    if (!result.success) {
      return res.status(500).json({ success: false, error: result.error });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Quote API Error:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
};
