const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { getChatHistory, getChatPartners } = require('../controllers/chatController');

const router = express.Router();

router.get('/partners', protect, getChatPartners);
router.get('/history/:partnerId', protect, getChatHistory);

module.exports = router;
