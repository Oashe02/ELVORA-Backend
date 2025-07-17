import  multer  from 'multer';

// Configure multer for memory storage
const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 1024 * 1024 * 10, // 10 MB file size limit
  },
});

export default memoryUpload;
