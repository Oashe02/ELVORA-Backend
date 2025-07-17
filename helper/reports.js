import moment from 'moment';
// import Enquiry from '../model/Enqui';
import {sendMail} from './mail.js';
import User from '../model/User.js';
import { UserRoles, isPROD } from '../utils/utils.js';
import { reportTemplate } from '../template/reportTemplate.js';
import { allUserReportTemplate } from '../template/allUserReportTemplate.js';


// Generate a summary of today's enquiries
export const generateIndividualUsersReport = async () => {
	try {
		// Get today's date in the UAE timezone (Asia/Dubai) using moment
		const today = moment().startOf('day');
		const tomorrow = moment(today).add(1, 'day');
		// console.log({ today, tomorrow });

		// Fetch enquiries created today

		const admins = await User.find({});

		// Initialize counters for each status

		const mailSend = admins.map(async (admin) => {
			const enquiries = await Enquiry.find({
				updatedAt: { $gte: today.toDate(), $lt: tomorrow.toDate() },
				assignedTo: admin._id,
			});
			// console.log({
			// 	enquiries,
			// 	assignedTo: admin._id,
			// });

			// Prepare the report content
			let report = `Daily Enquiry Report for ${today.format('YYYY-MM-DD')}\n\n`;

			let statusCounts = {
				pending: 0,
				assigned: 0,
				resolved: 0,
				hold: 0,
			};

			// Count enquiries by status
			enquiries.forEach((enquiry) => {
				if (statusCounts[enquiry.status.toLowerCase()] !== undefined) {
					statusCounts[enquiry.status.toLowerCase()]++;
				}
			});
			// report += `Total Enquiries: ${enquiries.length}\n\n`;
			// report += `Status Breakdown:\n`;
			// report += `  Pending: ${statusCounts.pending}\n`;
			// report += `  Assigned: ${statusCounts.assigned}\n`;
			// report += `  Resolved: ${statusCounts.resolved}\n`;
			// report += `  Hold: ${statusCounts.hold}\n\n`;
			// report += `Detailed Enquiries:\n\n`;
			// enquiries.forEach((enquiry, index) => {
			// 	report += `${index + 1}. Name: ${enquiry.name}\n`;
			// 	report += `   Email: ${enquiry.email}\n`;
			// 	report += `   Phone: ${enquiry.phoneNumber || 'N/A'}\n`;
			// 	report += `   Status: ${enquiry.status}\n`;
			// 	report += `   Created At: ${moment(enquiry.createdAt).format(
			// 		'HH:mm A'
			// 	)}\n\n`;
			// });

			// Send the report via email
			console.log({ isPROD });

			if (isPROD)
				await sendMail(
					[admin.email],
					report,
					reportTemplate(admin, enquiries, statusCounts)
				);
		});
	} catch (error) {
		console.error('Error generating report:', error);
	}
};

// Generate and send a personalized report for a user
// const generateAndSendUserReport = async (user) => {
// 	try {
// 		const today = moment().startOf('day');
// 		const now = moment();

// 		// Fetch the user details
// 		const enquiries = await Enquiry.find({
// 			assignedTo: user._id,
// 			createdAt: { $gte: today.toDate(), $lt: now.toDate() },
// 		});

// 		// Group tasks by status for reporting
// 		const totalTasks = enquiries.length;
// 		const pendingTasks = enquiries.filter(
// 			(task) => task.status === 'pending'
// 		).length;
// 		const onHoldTasks = enquiries.filter(
// 			(task) => task.status === 'hold'
// 		).length;
// 		const resolvedTasks = enquiries.filter(
// 			(task) => task.status === 'resolved'
// 		).length;
// 		const assignedTasks = enquiries.filter(
// 			(task) => task.status === 'assigned'
// 		).length;

// 		// Prepare the detailed report content
// 		let report = `End-of-Day Report for ${user.userName} (${today.format(
// 			'YYYY-MM-DD'
// 		)})\n\n`;
// 		report += `Total Assigned Tasks: ${totalTasks}\n`;
// 		report += `Pending: ${pendingTasks}\n`;
// 		report += `On Hold: ${onHoldTasks}\n`;
// 		report += `Resolved: ${resolvedTasks}\n`;
// 		report += `Assigned: ${assignedTasks}\n\n`;

// 		// Add a detailed breakdown of each enquiry
// 		enquiries.forEach((enquiry, index) => {
// 			report += `${index + 1}. Name: ${enquiry.name}\n`;
// 			report += `   Status: ${enquiry.status}\n`;
// 			report += `   Email: ${enquiry.email}\n`;
// 			report += `   Phone: ${enquiry.phoneNumber || 'N/A'}\n`;
// 			report += `   Created At: ${moment(enquiry.createdAt).format(
// 				'HH:mm A'
// 			)}\n\n`;
// 		});

// 		// Send the personalized report to the user via email
// 		await sendMail(
// 			user.email,
// 			`Your Daily Task Report - ${today.format('YYYY-MM-DD')}`,
// 			report
// 		);

// 		console.log(`Report sent to ${user.userName} successfully!`);
// 	} catch (error) {
// 		console.error('Error generating or sending report:', error);
// 	}
// };

export const generateAndSendUserReportsToAdmin = async () => {
	try {
		const today = moment().startOf('day');

		// Fetch all active users
		const users = await User.find({
			isActive: true,
			isNotificationOff: false,
			role: { $ne: UserRoles.ADMIN },
		});

		// Prepare individual reports for each user
		let userReports = [];

		for (const user of users) {
			// Fetch user's enquiries for the day
			const enquiries = await Enquiry.find({ assignedTo: user._id });

			// Count tasks by status
			const statusCounts = {
				total: enquiries.length,
				pending: enquiries.filter((task) => task.status === 'pending').length,
				hold: enquiries.filter((task) => task.status === 'hold').length,
				resolved: enquiries.filter((task) => task.status === 'resolved').length,
				assigned: enquiries.filter((task) => task.status === 'assigned').length,
			};

			// Store user-specific report data
			userReports.push({
				user,
				enquiries,
				statusCounts,
			});
		}

		// Fetch all admins
		const admins = await User.find({ role: UserRoles.ADMIN });
		// console.log(JSON.stringify(admins));

		// Send the compiled report to each admin
		for (const admin of admins) {
			const reportContent = allUserReportTemplate(userReports, today); // Pass userReports and today's date to the template function
			if (isPROD) {
				await sendMail(
					[admin.email],
					`End-of-Day User Progress Report for ${today.format('YYYY-MM-DD')}`,
					reportContent
				);
				console.log(
					`Report sent to admin ${admin.userName} (${admin.email}) successfully!`
				);
			}
		}
	} catch (error) {
		console.error('Error generating or sending reports:', error);
	}
};
