// const nodeMailer = require('nodemailer');

// const transport = nodeMailer.createTransport({
// 	host: 'smtp.zoho.com',
// 	secure: true,
// 	port: 465,
// 	auth: {
// 		user: process.env.EMAIL_ID,
// 		pass: process.env.EMAIL_PASS,
// 	},
// });

// const sendMail = async ({
// 	name,
// 	email,
// 	phoneNumber,
// 	messages,
// 	file,
// 	profession,
// }) => {
// 	try {
// 		console.log({
// 			name,
// 			email,
// 			phoneNumber,
// 			messages,
// 			file,
// 			profession,
// 		});

// 		// const file = req.file;
// 		// console.log({ file });
// 		const option = {
// 			from: 'service@ashadnasim.com',
// 			to: ['anwer.aamish@gmail.com'],
// 			// to: "ashadnasim123@gmail.com",
// 			// to: ["info@ultratec3d.ae", "ashadnasim123@gmail.com"],
// 			subject: `New message from ${name}`,
// 			html: `
// 				<p>Hello 707 RealEstate,</p>
// 				<p>You got a new application from ${name}:</p>
// 				<p>Email id is  ${email}:</p>
// 				<p>Phone Number is ${phoneNumber}:</p>
// 				<p>Profession is ${profession}:</p>

// 				<p style="padding: 12px; border-left: 4px solid #d0d0d0; font-style: italic;">${messages}</p>

// 				${
// 					file
// 						? `<p>Attached Resume: <a href="${file}" target="_blank">Open File</a></p>`
// 						: ''
// 				}

// 				<p>Best wishes,<br>Controlshift team</p>
// 			`,
// 		};

// 		const mailRes = await transport.sendMail(option);
// 		console.log({
// 			mailRes,
// 		});
// 		return true;
// 	} catch (error) {
// 		console.log(error);
// 		return false;
// 	}
// };

// module.exports = sendMail;

// const Resend = require('resend');
// export const resend = new Resend(process.env.RESEND_API_KEY || '');
const sendMail = null;
module.exports = {
	sendMail,
};
