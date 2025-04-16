const User = require('../models/user.model');
const TokenBlacklist = require('../models/tokenBlacklist.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const apiResponse = require('../helpers/response');

// [POST]: BASE_URL/api/auth/register
module.exports.register = async (req, res) => {
  let { username, firstName, lastName, email, password } = req.body;

  const existEmail = await User.findOne({
    email: email,
  });

  if(existEmail) {
    return apiResponse(res, 400, 'Email already exists.');
  }

  const existUsername = await User.findOne({
    username: username
  })

  if (existUsername) {
    return apiResponse(res, 400, 'Username already exists.');
  }

  password = await bcrypt.hash(password, 10);
  const user = new User({
    username,
    firstName,
    lastName,
    email,
    password
  });
  await user.save();

  return apiResponse(res, 200, 'User created successfully.');
}

// [POST]: BASE_URL/api/auth/login
module.exports.login = async (req, res) => {
  let { email, password } = req.body;

  const user = await User.findOne({
    email: email,
  });

  if(!user) {
    return apiResponse(res, 400, 'Email is invald.');
  }

  const jti = uuidv4();
  const token = jwt.sign(
    { userId: user._id, jti },
    process.env.JWT_SECRET_KEY,
    { expiresIn: "30d" }
  );

  if(!await bcrypt.compare(password, user.password)) {
    return apiResponse(res, 400, 'Password does not match.');
  }

  res.cookie("token", token);

  return apiResponse(res, 200, 'Login successfully.', {
    token,
    user
  });
}


module.exports.logout = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return apiResponse(res, 401, 'Unauthorized: No token provided.');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    const existing = await TokenBlacklist.findOne({ jti: decoded.jti });
    if (existing) {
      return apiResponse(res, 200, 'Already logged out.');
    }

    await TokenBlacklist.create({
      jti: decoded.jti,
      expiredAt: new Date(decoded.exp * 1000)
    });

    return apiResponse(res, 200, 'Logout successfully.');
  } catch (err) {
    console.error('Logout error:', err);
    return apiResponse(res, 400, 'Logout failed.');
  }
};