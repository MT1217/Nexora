const express = require('express');
const multer = require('multer');
const { protect, authorize } = require('../middleware/authMiddleware');
const { 
  uploadCourseFile, 
  getMentorFiles, 
  getMyUploadedFiles, 
  deleteFile 
} = require('../controllers/fileController');

const router = express.Router();

// Multer memory storage configuration (since we upload buffer to Cloudinary or write buffer to local fallback)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max file size (e.g. for video uploads)
  }
});

router.post('/upload', protect, authorize('mentor'), upload.single('file'), uploadCourseFile);
router.get('/mentor/:mentorId', protect, getMentorFiles);
router.get('/my-uploads', protect, authorize('mentor'), getMyUploadedFiles);
router.delete('/:id', protect, authorize('mentor'), deleteFile);

module.exports = router;
