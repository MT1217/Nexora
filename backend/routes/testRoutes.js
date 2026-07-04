const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  createMockTest,
  getMentorMockTests,
  getTestDetails,
  submitMockTest,
  getMyAttempts,
  getMentorStudentScores,
  getTestAttemptAnalysis
} = require('../controllers/testController');

const router = express.Router();

router.post('/create', protect, authorize('mentor'), createMockTest);
router.get('/mentor/scores', protect, authorize('mentor'), getMentorStudentScores);
router.get('/mentor/:mentorId', protect, getMentorMockTests);
router.get('/my-attempts', protect, authorize('student'), getMyAttempts);
router.get('/:id', protect, getTestDetails);
router.post('/:id/submit', protect, authorize('student'), submitMockTest);
router.get('/:id/analysis', protect, authorize('student'), getTestAttemptAnalysis);

module.exports = router;
