const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc    Get all mentors or search mentors by name
// @route   GET /api/mentors
// @access  Private
const getAllMentors = async (req, res) => {
  const { search } = req.query;

  try {
    let filter = { role: 'mentor' };

    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    const mentors = await User.find(filter).select('name email picture role');
    res.status(200).json({ success: true, count: mentors.length, mentors });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Subscribe to a mentor
// @route   POST /api/mentors/:id/subscribe
// @access  Private (Students only)
const subscribeToMentor = async (req, res) => {
  const mentorId = req.params.id;
  const studentId = req.user.id;

  try {
    // 1. Confirm mentor exists
    const mentor = await User.findOne({ _id: mentorId, role: 'mentor' });
    if (!mentor) {
      return res.status(404).json({ success: false, message: 'Mentor not found' });
    }

    // 2. Add to student's subscriptions
    await User.findByIdAndUpdate(studentId, {
      $addToSet: { subscribedMentors: mentorId },
    });

    res.status(200).json({ 
      success: true, 
      message: `Successfully subscribed to mentor: ${mentor.name}` 
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Unsubscribe from a mentor
// @route   POST /api/mentors/:id/unsubscribe
// @access  Private (Students only)
const unsubscribeToMentor = async (req, res) => {
  const mentorId = req.params.id;
  const studentId = req.user.id;

  try {
    const student = await User.findById(studentId);
    if (!student.subscribedMentors.includes(mentorId)) {
      return res.status(400).json({ success: false, message: 'You are not subscribed to this mentor' });
    }

    await User.findByIdAndUpdate(studentId, {
      $pull: { subscribedMentors: mentorId },
    });

    res.status(200).json({ success: true, message: 'Successfully unsubscribed from mentor' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get subscribed mentors
// @route   GET /api/mentors/subscribed
// @access  Private (Students only)
const getSubscribedMentors = async (req, res) => {
  try {
    const student = await User.findById(req.user.id).populate('subscribedMentors', 'name email picture');
    res.status(200).json({ success: true, count: student.subscribedMentors.length, mentors: student.subscribedMentors });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get mentor's direct student subscribers
// @route   GET /api/mentors/my-students
// @access  Private (Mentors only)
const getMyStudents = async (req, res) => {
  try {
    const students = await User.find({
      role: 'student',
      subscribedMentors: req.user.id,
    }).select('name email picture');

    res.status(200).json({ success: true, count: students.length, students });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current student's mailbox notifications
// @route   GET /api/mentors/mailbox
// @access  Private (Students only)
const getMailboxNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user.id })
      .populate('sender', 'name picture')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: notifications.length, notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark all student notifications as read
// @route   PUT /api/mentors/mailbox/read
// @access  Private (Students only)
const markMailboxAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, read: false },
      { $set: { read: true } }
    );
    res.status(200).json({ success: true, message: 'All mailbox notifications marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllMentors,
  subscribeToMentor,
  unsubscribeToMentor,
  getSubscribedMentors,
  getMyStudents,
  getMailboxNotifications,
  markMailboxAsRead,
};
