const mongoose = require('mongoose');

const tokenBlacklistSchema = new mongoose.Schema({
  jti: { type: String, required: true },
  expiredAt: { type: Date, default: () => Date.now() + 30 * 24 * 60 * 60 * 1000 },
});

tokenBlacklistSchema.index({ expiredAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('TokenBlacklist', tokenBlacklistSchema, 'tokenblacklists');
