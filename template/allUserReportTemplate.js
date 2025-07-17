import moment from 'moment'; // Import moment

export const allUserReportTemplate = (userReports, reportDate) => {
	return `
	<!DOCTYPE html>
	<html lang="en">
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<title>End-of-Day User Progress Report</title>
	</head>
	<body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
		<h2 style="text-align: center; color: #333;">End-of-Day User Progress Report</h2>
		<p style="text-align: center; color: #555;">Date: ${reportDate.format(
			'YYYY-MM-DD'
		)}</p>

		${userReports
			.map(
				({ user, enquiries, statusCounts }) => `
				<div style="border-bottom: 1px solid #ddd; margin-top: 20px; padding-bottom: 10px;">
					<h3 style="color: #007BFF;">${user.userName}</h3>
					<p><strong>Total Enquiries Assigned:</strong> ${statusCounts.total}</p>
					<ul style="list-style: none; padding: 0;">
						<li><strong>Pending:</strong> ${statusCounts.pending}</li>
						<li><strong>Assigned:</strong> ${statusCounts.assigned}</li>
						<li><strong>Resolved:</strong> ${statusCounts.resolved}</li>
						<li><strong>On Hold:</strong> ${statusCounts.hold}</li>
					</ul>

					<h4>Detailed Enquiry Report</h4>
					<table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
						<thead>
							<tr style="background-color: #f9f9f9;">
								<th style="padding: 8px; border: 1px solid #ddd;">#</th>
								<th style="padding: 8px; border: 1px solid #ddd;">Name</th>
								<th style="padding: 8px; border: 1px solid #ddd;">Status</th>
								<th style="padding: 8px; border: 1px solid #ddd;">Email</th>
								<th style="padding: 8px; border: 1px solid #ddd;">Phone</th>
								<th style="padding: 8px; border: 1px solid #ddd;">Created At</th>
							</tr>
						</thead>
						<tbody>
							${enquiries
								.map(
									(enquiry, index) => `
									<tr>
										<td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${
											index + 1
										}</td>
										<td style="padding: 8px; border: 1px solid #ddd;">${enquiry.name}</td>
										<td style="padding: 8px; border: 1px solid #ddd;">${enquiry.status}</td>
										<td style="padding: 8px; border: 1px solid #ddd;">${enquiry.email || 'N/A'}</td>
										<td style="padding: 8px; border: 1px solid #ddd;">${
											enquiry.phoneNumber || 'N/A'
										}</td>
										<td style="padding: 8px; border: 1px solid #ddd;">${moment(
											enquiry.createdAt
										).format('HH:mm A')}</td>
									</tr>`
								)
								.join('')}
						</tbody>
					</table>
				</div>
			`
			)
			.join('')}

		<p style="margin-top: 20px; text-align: center; color: #777;">Please log in to the system and take the necessary actions. If you have any questions, contact the support team.</p>
		<p style="text-align: center; font-size: 12px; color: #aaa;">© 2024 | ControlShift | ControlShift.ae</p>
	</body>
	</html>
	`;
};
