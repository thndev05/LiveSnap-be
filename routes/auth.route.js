const express = require('express');
const controller = require("../controllers/auth.controller");
const router = express.Router();

router.post('/register', controller.register);

router.post('/login', controller.login);

router.post('/logout', controller.logout);

router.post('/send-verification-otp', controller.sendVerificationOTP);

module.exports = router;
