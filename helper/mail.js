import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API);

export async function sendMail(toInArray, subject, html) {
	try {
		const mailRes = await resend.emails.send({
			from: 'noreply@controlshift.ae', // Must match your verified sender
			to: toInArray, // Array of recipients
			subject,
			html,
		});
		console.log({ mailRes });
		return mailRes;
	} catch (error) {
		console.error('Error sending email:', error);
		throw error;
	}
}
