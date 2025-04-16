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


module.exports = router;
