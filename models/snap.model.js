const mongoose = require('mongoose');

const snapSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  caption: {
    type: String,
    default: '',
    maxlength: 36
  },
  imageUrl: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Snap = mongoose.model('Snap', snapSchema, 'snaps');
module.exports = Snap;