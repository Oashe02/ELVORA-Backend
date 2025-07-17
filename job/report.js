import  cron  from 'node-cron';

import  {
	generateIndividualUsersReport,
	generateAndSendUserReportsToAdmin,
} from '../helper/reports.js';

cron.schedule(
	'0 17 * * *',
	() => {
		console.log('Running a job at 5:00 AM UAE timezone');
		generateIndividualUsersReport();
		generateAndSendUserReportsToAdmin();
	},
	{
		scheduled: true,
		timezone: 'Asia/Dubai', // UAE timezone is Asia/Dubai
	}
);
