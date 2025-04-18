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
  image: {
    type: String,
    required: true,
  },
  reactions: [
    {
      userReactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      type: {
        type: String,
        enum: ['like', 'love', 'haha', 'wow', 'sad', 'angry'],
      },
      reactedAt: { type: Date, default: Date.now }
    }
  ],
  deleted: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Snap = mongoose.model('Snap', snapSchema, 'snaps');
module.exports = Snap;