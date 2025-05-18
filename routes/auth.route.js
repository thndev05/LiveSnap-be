const express = require('express');
const controller = require("../controllers/auth.controller");
const router = express.Router();

router.post('/register', controller.register);

router.post('/login', controller.login);

router.post('/logout', controller.logout);

router.post('/send-verification-otp', controller.sendVerificationOTP);

router.post('/forgot-password', controller.forgotPassword);

router.post('/verify-otp', controller.verifyOTP)

router.post('/reset-password', controller.resetPassword);

module.exports = router;
