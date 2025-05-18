const User = require('../models/user.model');
const TokenBlacklist = require('../models/tokenBlacklist.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const apiResponse = require('../helpers/response');
const nodemailer =  require('nodemailer');
const { setOTP, verifyOTP } = require('../helpers/otp.helper');

// [POST]: BASE_URL/api/auth/register
module.exports.register = async (req, res) => {
  let { username, firstName, lastName, email, password, otp } = req.body;

  // Verify OTP first
  if (!otp) {
    return apiResponse(res, 400, 'OTP is required.');
  }

  const isOTPValid = verifyOTP(email, otp);
  if (!isOTPValid) {
    return apiResponse(res, 400, 'Invalid or expired OTP.');
  }

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

  const user = await User.findOne({ email });

  if (!user) {
    return apiResponse(res, 400, 'Email is invalid.');
  }

  const isPasswordCorrect = await bcrypt.compare(password, user.password);
  if (!isPasswordCorrect) {
    return apiResponse(res, 400, 'Password does not match.');
  }

  const jti = uuidv4();
  const token = jwt.sign(
      { userId: user._id, jti },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "30d" }
  );

  res.cookie("token", token);

  const userData = {
    id: user._id,
    username: user.username,
    email: user.email,
    avatar: user.avatar,
    firstName: user.firstName,
    lastName: user.lastName,
    isGold: user.isGold
  };

  return apiResponse(res, 200, 'Login successfully.', {
    token,
    user: userData
  });
};



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

module.exports.sendVerificationOTP = async (req, res) => {
  try {
    let { email } = req.body;
    const existEmail = await User.findOne({
      email: email,
    });

    if(existEmail) {
      return apiResponse(res, 400, 'Email already exists.');
    }

    const otp = setOTP(email)

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_ADDRESS,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const content = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>LiveSnap Email Verification</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              margin: 0;
              padding: 0;
              background-color: #f4f4f4;
            }
            .container {
              max-width: 600px;
              margin: 20px auto;
              padding: 20px;
              background-color: #ffffff;
              border-radius: 10px;
              box-shadow: 0 0 10px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center;
              padding: 20px 0;
              background-color: #4a90e2;
              border-radius: 8px 8px 0 0;
            }
            .header h1 {
              color: #ffffff;
              margin: 0;
              font-size: 24px;
            }
            .content {
              padding: 30px 20px;
              text-align: center;
            }
            .otp-container {
              margin: 30px 0;
              padding: 20px;
              background-color: #f8f9fa;
              border-radius: 8px;
            }
            .otp-code {
              font-size: 32px;
              font-weight: bold;
              color: #4a90e2;
              letter-spacing: 5px;
            }
            .footer {
              text-align: center;
              padding: 20px;
              color: #666;
              font-size: 12px;
            }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background-color: #4a90e2;
              color: #ffffff;
              text-decoration: none;
              border-radius: 5px;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>LiveSnap Verification</h1>
            </div>
            <div class="content">
              <h2>Welcome to LiveSnap!</h2>
              <p>Thank you for choosing LiveSnap. To complete your registration, please use the following verification code:</p>
              
              <div class="otp-container">
                <div class="otp-code">${otp}</div>
              </div>
              
              <p>This code will expire in 10 minutes.</p>
              <p>If you didn't request this verification code, please ignore this email.</p>
              
              <a href="https://livesnap.app" class="button">Visit LiveSnap</a>
            </div>
            <div class="footer">
              <p>© 2025 LiveSnap. All rights reserved.</p>
              <p>This is an automated message, please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const mainOptions = {
      from: `LiveSnap <no-reply@livesnap.app>`,
      to: email,
      subject: 'Verify Your LiveSnap Account',
      text: `Your LiveSnap verification code is: ${otp}. This code will expire in 10 minutes.`,
      html: content
    }

    await transporter.sendMail(mainOptions);
    return apiResponse(res, 200, 'Verification code sent successfully.');

  } catch (err) {
    console.error('Email verification error:', err);
    return apiResponse(res, 500, 'Failed to send verification code.');
  }
}