const User = require('../models/user.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const apiResponse = require('../helpers/response');

// [POST]: BASE_URL/api/users/register
module.exports.register = async (req, res) => {
  let { username, firstName, lastName, email, password } = req.body;

  const existEmail = await User.findOne({
    email: email,
  });

  if(existEmail) {
    return apiResponse(res, 400, 'Email already exists.');
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

// [POST]: BASE_URL/api/users/login
module.exports.login = async (req, res) => {
  let { email, password } = req.body;

  const user = await User.findOne({
    email: email,
  });

  if(!user) {
    return apiResponse(res, 400, 'Email already exists.');
  }

  const token = jwt.sign(
    { userId: user._id },
    process.env.JWT_SECRET_KEY,
    { expiresIn: "30d" }
  );

  if(!await bcrypt.compare(password, user.password)) {
    return apiResponse(res, 400, 'Password does not match.');
  }

  res.cookie("token", token);

  return apiResponse(res, 200, 'Login successfully.', {
    token: token
  });
}

// [GET]: BASE_URL/api/users/detail
module.exports.detail = async (req, res) => {
  try {
    return apiResponse(res, 200, 'Get detail successfully', {
      info: req.user
    })
  } catch (err) {
    return apiResponse(res, 400, 'Get detail failed');
  }
}