const User = require('../models/user.model');
const cloudinary = require('cloudinary').v2;
const apiResponse = require('../helpers/response');

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

// [POST]: BASE_URL/api/users/set-avatar
module.exports.setAvatar = async (req, res) => {
  try {
    const userId = req.user._id;

    if (req.body.files && req.body.files.length > 0) {
      const avatarUrl = req.body.files[0].image;

      await User.findByIdAndUpdate(userId, {
        avatar: avatarUrl
      });

      return apiResponse(res, 200, 'Set avatar successfully.', avatarUrl);
    }
  } catch (e) {
    return apiResponse(res, 400, 'Failed to set avatar.')
  }
}

// [PATCH]: BASE_URL/api/users/remove-avatar
module.exports.removeAvatar = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if(user.avatar === null || user.avatar === '') {
      return apiResponse(res, 400, 'Dont have avatar to remove.');
    }

    const publicId = user.avatar.split('/').pop().split('.')[0];
    if (publicId) {
      await cloudinary.uploader.destroy(publicId);
    }

    user.avatar = null;
    await user.save();

    return apiResponse(res, 200, 'Remove avatar successfully.');
  } catch (e) {
    console.error('Remove avatar error:', e);
    return apiResponse(res, 400, 'Failed to remove avatar.');
  }
}

// [PATCH]: BASE_URL/api/users/update-name
module.exports.updateName = async (req, res) => {
  try {
    const userId = req.user._id;
    const { firstName, lastName } = req.body;

    const update = {};
    if(firstName) {
      update.firstName = firstName;
    }
    if(lastName) {
      update.lastName = lastName;
    }

    await User.findByIdAndUpdate(userId, update);

    return apiResponse(res, 200, 'Update name successfully.', update);
  } catch (e) {
    return apiResponse(res, 400, 'Failed to update name.');
  }
}

// [PATCH]: BASE_URL/api/users/update-name
module.exports.updateEmail = async (req, res) => {
  try {
    const userId = req.user._id;
    const { email } = req.body;

    const update = {};

    if(email === req.user.email) {
      return apiResponse(res, 400, 'Please enter another email address.');
    }

    if(email) {
      update.email = email;
    }

    await User.findByIdAndUpdate(userId, update);

    return apiResponse(res, 200, 'Update email successfully.', update);
  } catch (e) {
    return apiResponse(res, 400, 'Failed to update email.');
  }
}

// [GET]: BASE_URL/api/users/search?username=abc
module.exports.search = async (req, res) => {
  try {
    const userId = req.user._id;
    const username = req.query.username;

    if (!username) {
      return apiResponse(res, 400, 'Username query is required.');
    }

    const users = await User.find({
      username: { $regex: username, $options: 'i' },
      _id: { $ne: userId }
    }).select('username firstName lastName avatar');

    return apiResponse(res, 200, 'Search users successfully.', users);
  } catch (e) {
    console.error('Search user error:', e);
    return apiResponse(res, 400, 'Failed to search user.');
  }
};

// [POST]: BASE_URL/api/users/check-email-exist
module.exports.checkEmailExist = async (req, res) => {
  try {
    const email = req.body.email;
    const existEmail = await User.findOne({
      email: email
    });

    if(existEmail) {
      return res.json({
        code: 200,
        exist: true,
        message: 'Email already exists.'
      })
    } else {
      return res.json({
        code: 200,
        exist: false,
        message: 'Email does not exist.'
      })
    }
  } catch (e) {
    return apiResponse(res, 400, 'Failed to check exist email.');
  }
}

// [POST]: BASE_URL/api/users/check-username-exist
module.exports.checkUsernameExist = async (req, res) => {
  try {
    const username = req.body.username;
    const existUsername = await User.findOne({
      username: username
    });

    if(existUsername) {
      return res.json({
        code: 200,
        exist: true,
        message: 'Username already exists.'
      })
    } else {
      return res.json({
        code: 200,
        exist: false,
        message: 'Username does not exist.'
      })
    }
  } catch (e) {
    return apiResponse(res, 400, 'Failed to check exist email.');
  }
}