const User = require('../models/user.model');
const TokenBlacklist = require('../models/tokenBlacklist.model');
const jwt = require('jsonwebtoken');
const response = require('../helpers/response');

module.exports.requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return response(res, 400, 'Token is required');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    const isBlacklisted = await TokenBlacklist.findOne({ jti: decoded.jti });
    if (isBlacklisted) {
      return res.status(400).json({ message: 'Token is revoked.' });
    }

    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return response(res, 400, 'User not found');
    }

    req.user = user;

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}