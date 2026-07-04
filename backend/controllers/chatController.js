const Message = require('../models/Message');
const User = require('../models/User');

// @desc    Get historical chat messages between two users
// @route   GET /api/chat/history/:partnerId
// @access  Private
const getChatHistory = async (req, res) => {
  const { partnerId } = req.params;
  const myId = req.user.id;

  try {
    const messages = await Message.find({
      $or: [
        { sender: myId, receiver: partnerId },
        { sender: partnerId, receiver: myId },
      ],
    })
      .sort({ createdAt: 1 })
      .populate('sender', 'name picture role')
      .populate('receiver', 'name picture role');

    res.status(200).json({ success: true, count: messages.length, messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get eligible messaging partners (Subscribed students / mentors + anyone already chatted with)
// @route   GET /api/chat/partners
// @access  Private
const getChatPartners = async (req, res) => {
  const myId = req.user.id;
  const myRole = req.user.role;

  try {
    let partnerIds = new Set();

    // 1. Fetch based on subscription relations
    if (myRole === 'student') {
      // Students can chat with their subscribed mentors
      const student = await User.findById(myId).select('subscribedMentors');
      if (student && student.subscribedMentors) {
        student.subscribedMentors.forEach((mId) => partnerIds.add(mId.toString()));
      }
    } else {
      // Mentors can chat with students subscribed to them
      const myStudents = await User.find({
        role: 'student',
        subscribedMentors: myId,
      }).select('_id');
      myStudents.forEach((stud) => partnerIds.add(stud._id.toString()));
    }

    // 2. Fetch based on message history (to capture any custom contacts outside current subscriptions)
    const chatLogs = await Message.find({
      $or: [{ sender: myId }, { receiver: myId }],
    }).select('sender receiver');

    chatLogs.forEach((msg) => {
      const sId = msg.sender.toString();
      const rId = msg.receiver.toString();
      if (sId !== myId) partnerIds.add(sId);
      if (rId !== myId) partnerIds.add(rId);
    });

    // 3. Populate metadata for these IDs
    const partners = await User.find({
      _id: { $in: Array.from(partnerIds) },
    }).select('name email picture role');

    res.status(200).json({ success: true, count: partners.length, partners });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getChatHistory,
  getChatPartners,
};
