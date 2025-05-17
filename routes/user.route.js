const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');
const controller = require("../controllers/user.controller");
const multer = require("multer");
const uploadCloud = require('../middlewares/uploadCloud.middleware');

const upload = multer({
  fileFilter: function (req, file, cb) {
    cb(null, true);
  }
}).any();

// Payment webhook endpoint - no auth required
router.post('/payment-webhook', controller.paymentWebhook);

router.get('/payment-qr', authMiddleware.requireAuth, controller.getPaymentQR);

router.get('/detail',
  authMiddleware.requireAuth,
  controller.detail
);

router.post('/set-avatar',
  authMiddleware.requireAuth,
  upload,
  uploadCloud.upload,
  controller.setAvatar
);

router.patch('/remove-avatar',
  authMiddleware.requireAuth,
  controller.removeAvatar
);

router.patch('/update-name',
  authMiddleware.requireAuth,
  controller.updateName
);

router.patch('/update-username',
  authMiddleware.requireAuth,
  controller.updateUsername
);

router.patch('/update-email',
  authMiddleware.requireAuth,
  controller.updateEmail
);

router.get('/search',
  authMiddleware.requireAuth,
  controller.search
);

router.post('/check-email-exist',
  controller.checkEmailExist
);

router.post('/check-username-exist',
  controller.checkUsernameExist
);

router.get('/:id', controller.getUserById);

router.post('/check-password',
    authMiddleware.requireAuth,
    controller.checkPassword
);

router.post('/fcm-token', authMiddleware.requireAuth, controller.updateFcmToken);

router.post('/send-feedback',
  authMiddleware.requireAuth,
  controller.sendFeedback
);

module.exports = router;
