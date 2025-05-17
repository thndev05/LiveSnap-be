const User = require('../models/user.model');
const Feedback = require('../models/feedback.model');
const cloudinary = require('cloudinary').v2;
const apiResponse = require('../helpers/response');
const FirebaseService = require('../services/firebase.service');
const axios = require('axios');

// [GET]: BASE_URL/api/users/detail
module.exports.detail = async (req, res) => {
  try {
    const user = req.user;

    const userInfo = {
      id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      firstName: user.firstName,
      lastName: user.lastName,
      isGold: user.isGold
    };

    return apiResponse(res, 200, 'Get detail successfully', {
      info: userInfo
    });
  } catch (err) {
    console.error('Get User Detail Error:', err);
    return apiResponse(res, 400, 'Get detail failed');
  }
};

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

// [PATCH]: BASE_URL/api/users/update-username
module.exports.updateUsername = async (req, res) => {
  try {
    const userId = req.user._id;
    const rawUsername = req.body.username;
    const username = rawUsername.trim().replace(/\s+/g, '');

    if (username === req.user.username) {
      return apiResponse(res, 400, 'Please enter another username.');
    }

    const existingUser = await User.findOne({ username: username });
    if (existingUser) {
      return apiResponse(res, 400, 'Username is already taken.');
    }

    const update = { username };
    await User.findByIdAndUpdate(userId, update);

    return apiResponse(res, 200, 'Update username successfully.', update);
  } catch (e) {
    console.error(e);
    return apiResponse(res, 400, 'Failed to update username.');
  }
};


// [GET]: BASE_URL/api/users/search?username=abc?limit=3
module.exports.search = async (req, res) => {
  try {
    const userId = req.user._id;
    const username = req.query.username;
    const limit = Math.min(parseInt(req.query.limit) || 3, 10);

    if (!username) {
      return apiResponse(res, 400, 'Username query is required.');
    }

    const users = await User.find({
      username: { $regex: username, $options: 'i' },
      _id: { $ne: userId }
    })
        .select('username firstName lastName avatar')
        .limit(limit);

    const formattedUsers = users.map(user => {
      const u = user.toObject();
      return {
        id: u._id,
        username: u.username,
        firstName: u.firstName,
        lastName: u.lastName,
        avatar: u.avatar,
      };
    });

    return apiResponse(res, 200, 'Search users successfully.', formattedUsers);
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

// [GET]: BASE_URL/api/users/:id
module.exports.getUserById = async (req, res) => {
    try {
        const userId = req.params.id;

        const user = await User.findById(userId).select('username email avatar firstName lastName isGold');

        if (!user) {
            return apiResponse(res, 404, 'User not found.');
        }

        const userInfo = {
            id: user._id,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            firstName: user.firstName,
            lastName: user.lastName,
            isGold: user.isGold,
        };

        return apiResponse(res, 200, 'Get user by ID successfully.', {
            info: userInfo
        });
    } catch (err) {
        console.error('Get User By ID Error:', err);
        return apiResponse(res, 400, 'Failed to get user by ID.');
    }
};


// [POST]: BASE_URL/api/users/check-password
module.exports.checkPassword = async (req, res) => {
    try {
        const userId = req.user._id;
        const { password } = req.body;

        if (!password) {
            return apiResponse(res, 400, 'Password is required.');
        }

        const user = await User.findById(userId).select('password');

        if (!user) {
            return apiResponse(res, 404, 'User not found.');
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (isMatch) {
            return res.json({
                code: 200,
                isValid: true,
                message: 'Password is correct.'
            });
        } else {
            return res.status(400).json({
                code: 400,
                isValid: false,
                message: 'Password is incorrect.'
            });
        }
    } catch (e) {
        console.error('Check password error:', e);
        return apiResponse(res, 400, 'Failed to check password.');
    }
};

// [POST] /api/users/fcm-token
module.exports.updateFcmToken = async (req, res) => {
  try {
    const userId = req.user._id;
    const { fcmToken } = req.body;

    if (!fcmToken) {
      return apiResponse(res, 400, 'FCM token is required');
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { fcmToken },
      { new: true }
    );

    if (!user) {
      return apiResponse(res, 404, 'User not found');
    }

    return apiResponse(res, 200, 'FCM token updated successfully');
  } catch (error) {
    console.error('Update FCM Token Error:', error);
    return apiResponse(res, 500, 'Server error');
  }
};

// [POST]: BASE_URL/api/users/payment-webhook
module.exports.paymentWebhook = async (req, res) => {
  try {
    const { content, transferAmount } = req.body;

    console.log(`Content: ${content}`);
    console.log(`transferAmount: ${transferAmount}`);

    if (transferAmount === 2000) {
      const user = await User.findById(content);

      if (user) {
        // Update user to gold status
        user.isGold = true;
        user.lastGoldAt = new Date();
        await user.save();

        // Send notification to user
        await FirebaseService.sendNotification(
          user._id,
          'Gold Membership Activated',
          'Congratulations! Your gold membership has been activated.',
          {
            type: 'GOLD_MEMBERSHIP',
            status: 'activated'
          }
        );

        return res.status(200).json({
          success: true,
          message: 'User upgraded to gold successfully'
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Webhook processed'
    });
  } catch (err) {
    console.error('Payment Webhook Error:', err);
    // Still return 200 to prevent webhook retries
    return res.status(200).json({
      success: true,
      message: 'Webhook processed'
    });
  }
};

// [GET]: BASE_URL/api/users/payment-qr
module.exports.getPaymentQR = async (req, res) => {
  try {
    const userId = req.user._id;

    // Construct QR code URL
    const qrCodeUrl = `https://qr.sepay.vn/img?bank=TPBank&acc=00002084815&template=qronly&amount=2000&des=${userId}`;

    // Fetch QR code image as binary data
    const response = await axios.get(qrCodeUrl, {
      responseType: 'arraybuffer'
    });

    // Convert binary data to Base64 string
    const base64Image = Buffer.from(response.data, 'binary').toString('base64');

    // Format response
    return res.json({
      code: 200,
      message: 'QR code generated successfully',
      data: {
        qrCode: base64Image,
        bank: "TPBank",
        accountNumber: "00002084815",
        accountName: "Huỳnh Quốc Khánh",
        amount: 2000,
        transferContent: userId.toString(),
      }
    });
  } catch (err) {
    console.error('Get Payment QR Error:', err);
    return res.status(500).json({
      code: 500,
      message: 'Failed to generate QR code',
    });
  }
};

// [POST]: BASE_URL/api/users/send-feedback
module.exports.sendFeedback = async (req, res) => {
  try {
    const userId = req.user._id;
    const { message } = req.body;

    if (!message || message.trim() === '') {
      return apiResponse(res, 400, 'Feedback message is required.');
    }

    const feedback = new Feedback({
      userId,
      message: message.trim(),
    });

    await feedback.save();

    return apiResponse(res, 200, 'Feedback sent successfully.', feedback);
  } catch (error) {
    console.error('Send feedback error:', error);
    return apiResponse(res, 500, 'Failed to send feedback.');
  }
};