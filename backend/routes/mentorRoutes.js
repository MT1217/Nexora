const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getAllMentors,
  subscribeToMentor,
  unsubscribeToMentor,
  getSubscribedMentors,
  getMyStudents,
  getMailboxNotifications,
  markMailboxAsRead
} = require('../controllers/mentorController');

const router = express.Router();

router.get('/', protect, getAllMentors);
router.get('/subscribed', protect, authorize('student'), getSubscribedMentors);
router.get('/my-students', protect, authorize('mentor'), getMyStudents);
router.get('/mailbox', protect, authorize('student'), getMailboxNotifications);
router.put('/mailbox/read', protect, authorize('student'), markMailboxAsRead);
router.post('/:id/subscribe', protect, authorize('student'), subscribeToMentor);
router.post('/:id/unsubscribe', protect, authorize('student'), unsubscribeToMentor);

module.exports = router;
