const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: true,
  },
  options: {
    type: [String],
    required: true,
    validate: [opts => opts.length >= 2, 'Must have at least 2 options'],
  },
  correctOptionIndex: {
    type: Number,
    required: true,
    min: 0,
  },
});

const mockTestSchema = new mongoose.Schema({
  mentor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  questions: [questionSchema],
}, {
  timestamps: true,
});

module.exports = mongoose.model('MockTest', mockTestSchema);
