const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    minlength: [3, 'Username must be at least 3 characters long'],
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 6 characters long'],
  },
  avatar: {
    type: String,
    default: null
  },
  fcmToken: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

const User = mongoose.model('User', userSchema, 'users');

module.exports = User;