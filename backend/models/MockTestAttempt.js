const mongoose = require('mongoose');

const mockTestAttemptSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  mockTest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MockTest',
    required: true,
  },
  score: {
    type: Number,
    required: true,
  },
  totalQuestions: {
    type: Number,
    required: true,
  },
  answers: {
    type: [Number], // Indecis of the options chosen by student for each question
    required: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('MockTestAttempt', mockTestAttemptSchema);
