const MockTest = require('../models/MockTest');
const MockTestAttempt = require('../models/MockTestAttempt');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc    Create new Mock Test
// @route   POST /api/tests/create
// @access  Private (Mentors only)
const createMockTest = async (req, res) => {
  const { title, description, questions } = req.body;

  if (!title || !questions || !Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ success: false, message: 'Please provide test title and a list of questions.' });
  }

  try {
    const newTest = await MockTest.create({
      mentor: req.user.id,
      title,
      description,
      questions,
    });

    // Notify Subscribed Students
    const subscribedStudents = await User.find({
      role: 'student',
      subscribedMentors: req.user.id,
    });

    const notificationMessage = `Your subscribed mentor ${req.user.name} published a new mock test: "${title}"`;

    const notificationPromises = subscribedStudents.map(async (student) => {
      const notification = await Notification.create({
        recipient: student._id,
        sender: req.user.id,
        message: notificationMessage,
        type: 'mock_test_upload',
        referenceId: newTest._id,
        onModel: 'MockTest',
      });

      // Socket emit
      const io = req.app.get('io');
      if (io) {
        io.to(`user_${student._id.toString()}`).emit('new_mailbox_message', {
          id: notification._id,
          message: notificationMessage,
          type: 'mock_test_upload',
          createdAt: notification.createdAt,
          senderName: req.user.name,
          referenceId: newTest._id,
        });
      }
    });

    await Promise.all(notificationPromises);

    res.status(201).json({
      success: true,
      message: `Mock test "${title}" published. Notified ${subscribedStudents.length} student(s).`,
      testId: newTest._id,
    });

  } catch (error) {
    console.error('Create Mock Test Error:', error);
    res.status(500).json({ success: false, message: 'Failed to create mock test' });
  }
};

// @desc    Get mock tests of a specific mentor
// @route   GET /api/tests/mentor/:mentorId
// @access  Private
const getMentorMockTests = async (req, res) => {
  const { mentorId } = req.params;

  try {
    // Check access
    const isMentorSelf = req.user.role === 'mentor' && req.user.id === mentorId;
    if (!isMentorSelf && req.user.role === 'student') {
      const student = await User.findById(req.user.id);
      if (!student.subscribedMentors.includes(mentorId)) {
        return res.status(403).json({ 
          success: false, 
          message: 'Access Denied. You must subscribe to the mentor to access mock tests.' 
        });
      }
    }

    const tests = await MockTest.find({ mentor: mentorId }).select('-questions.correctOptionIndex -__v');
    
    let attempts = [];
    if (req.user.role === 'student') {
      const testIds = tests.map(t => t._id);
      attempts = await MockTestAttempt.find({
        student: req.user.id,
        mockTest: { $in: testIds }
      });
    }

    res.status(200).json({ success: true, count: tests.length, tests, attempts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get detailed test questions (Hiding correct answers if user is a student)
// @route   GET /api/tests/:id
// @access  Private
const getTestDetails = async (req, res) => {
  try {
    const test = await MockTest.findById(req.params.id).populate('mentor', 'name picture');
    if (!test) {
      return res.status(404).json({ success: false, message: 'Mock test not found' });
    }

    // Verify student subscription
    if (req.user.role === 'student') {
      const student = await User.findById(req.user.id);
      if (!student.subscribedMentors.includes(test.mentor._id.toString())) {
        return res.status(403).json({
          success: false,
          message: 'Subscribe to the mentor first to access this mock test.',
        });
      }
    }

    // Convert mongoose Doc to JS object so we can delete the answer indexes
    const testObject = test.toObject();

    // Prevent cheating: Strip correct answers if request is by a student
    if (req.user.role === 'student') {
      testObject.questions.forEach((q) => {
        delete q.correctOptionIndex;
      });
    }

    res.status(200).json({ success: true, test: testObject });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Submit mock test replies and review scores
// @route   POST /api/tests/:id/submit
// @access  Private (Students only)
const submitMockTest = async (req, res) => {
  const { answers } = req.body; // Array of integers representing students responses

  if (!answers || !Array.isArray(answers)) {
    return res.status(400).json({ success: false, message: 'Answers format is invalid. Must provide array of options.' });
  }

  try {
    const test = await MockTest.findById(req.params.id);
    if (!test) {
      return res.status(404).json({ success: false, message: 'Mock test not found' });
    }

    // Check if student has already attempted this test
    const existingAttempt = await MockTestAttempt.findOne({
      student: req.user.id,
      mockTest: req.params.id,
    });
    if (existingAttempt) {
      return res.status(400).json({ 
        success: false, 
        message: 'You have already completed this mock test. You cannot take it a second time.' 
      });
    }

    if (answers.length !== test.questions.length) {
      return res.status(400).json({ 
        success: false, 
        message: `Answer sheet mismatch. The test has ${test.questions.length} questions but got ${answers.length} answers.` 
      });
    }

    // Grade MCQ response list
    let score = 0;
    const gradingResults = test.questions.map((q, idx) => {
      const studentChoice = answers[idx];
      const isCorrect = studentChoice === q.correctOptionIndex;
      if (isCorrect) score += 1;
      return {
        questionText: q.questionText,
        options: q.options,
        studentAnswer: studentChoice,
        correctAnswer: q.correctOptionIndex,
        isCorrect,
      };
    });

    const newAttempt = await MockTestAttempt.create({
      student: req.user.id,
      mockTest: test._id,
      score,
      totalQuestions: test.questions.length,
      answers,
    });

    res.status(200).json({
      success: true,
      message: 'Test submitted and graded successfully.',
      score,
      totalQuestions: test.questions.length,
      percentage: Math.round((score / test.questions.length) * 100),
      attemptId: newAttempt._id,
      results: gradingResults,
    });

  } catch (error) {
    console.error('Submit Test Error:', error);
    res.status(500).json({ success: false, message: 'Failed to process test submission' });
  }
};

// @desc    Get student's own attempts and marks
// @route   GET /api/tests/my-attempts
// @access  Private (Students only)
const getMyAttempts = async (req, res) => {
  try {
    const attempts = await MockTestAttempt.find({ student: req.user.id })
      .populate({
        path: 'mockTest',
        select: 'title description mentor',
        populate: {
          path: 'mentor',
          select: 'name picture',
        },
      })
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: attempts.length, attempts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all student exam submissions (For mentor test panel dashboard)
// @route   GET /api/tests/mentor/scores
// @access  Private (Mentors only)
const getMentorStudentScores = async (req, res) => {
  try {
    // 1. Find all mock tests authored by this mentor
    const myTests = await MockTest.find({ mentor: req.user.id });
    const testIds = myTests.map((t) => t._id);

    // 2. Fetch submissions for these test IDs
    const submissions = await MockTestAttempt.find({ mockTest: { $in: testIds } })
      .populate('student', 'name email picture')
      .populate('mockTest', 'title')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: submissions.length,
      submissions,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get detailed analysis of a student's mock test attempt
// @route   GET /api/tests/:testId/analysis
// @access  Private (Students only)
const getTestAttemptAnalysis = async (req, res) => {
  try {
    const test = await MockTest.findById(req.params.testId);
    if (!test) {
      return res.status(404).json({ success: false, message: 'Mock test not found' });
    }

    const attempt = await MockTestAttempt.findOne({
      student: req.user.id,
      mockTest: req.params.testId,
    });

    if (!attempt) {
      return res.status(404).json({ success: false, message: 'No attempt found for this mock test.' });
    }

    // Map questions with correct option index and student's chosen answer
    const analysisResults = test.questions.map((q, idx) => {
      const studentChoice = attempt.answers[idx];
      const isCorrect = studentChoice === q.correctOptionIndex;
      return {
        questionText: q.questionText,
        options: q.options,
        studentAnswer: studentChoice,
        correctAnswer: q.correctOptionIndex,
        isCorrect,
      };
    });

    res.status(200).json({
      success: true,
      score: attempt.score,
      totalQuestions: attempt.totalQuestions,
      percentage: Math.round((attempt.score / attempt.totalQuestions) * 100),
      results: analysisResults,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createMockTest,
  getMentorMockTests,
  getTestDetails,
  submitMockTest,
  getMyAttempts,
  getMentorStudentScores,
  getTestAttemptAnalysis,
};
