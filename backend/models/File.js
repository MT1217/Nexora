const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
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
  fileUrl: {
    type: String,
    required: true,
  },
  fileType: {
    type: String, // 'video', 'pdf', 'image', 'document', etc.
    required: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('File', fileSchema);
