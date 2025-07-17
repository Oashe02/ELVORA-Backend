const path = require('path');
const AWS = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');

const s3Config = new AWS.S3();

const multerS3Config = multerS3({
	s3: s3Config,
	bucket: process.env.AWS_IMAGE_BUCKET_NAME,
	metadata: function (req, file, cb) {
		console.log({ file });

		cb(null, { fieldName: file.fieldname });
	},
	key: function (req, file, cb) {
		console.log(file);
		cb(null, new Date().toISOString() + '-' + file.originalname);
	},
	acl: 'public-read',
});
const upload = multer({
	storage: multerS3Config,
	// fileFilter: fileFilter,
	limits: {
		fileSize: 1024 * 1024 * 38, // we are allowing only 38 MB max files
	},
});

export default upload;
