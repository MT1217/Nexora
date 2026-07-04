const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  picture: {
    type: String,
    default: '',
    get: function(value) {
      if (!value) {
        return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(this.email || 'user')}`;
      }
      return value;
    }
  },
  role: {
    type: String,
    required: true,
    enum: ['student', 'mentor'],
  },
  subscribedMentors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
}, {
  timestamps: true,
  toJSON: { getters: true },
  toObject: { getters: true },
});

module.exports = mongoose.model('User', userSchema);
