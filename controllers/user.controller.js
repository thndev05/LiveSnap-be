const User = require('../models/user.model');
const bcrypt = require('bcrypt');
const apiResponse = require('../helpers/response');

module.exports.test = async (req, res) => {
  const users = await User.find({});

  res.json(users);
}

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