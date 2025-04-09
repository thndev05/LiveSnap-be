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

router.post('/register', controller.register);
router.post('/login', controller.login);
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

module.exports = router;
