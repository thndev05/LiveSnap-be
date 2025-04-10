const express = require('express');
const router = express.Router();
const multer = require("multer");
const uploadCloud = require('../middlewares/uploadCloud.middleware');

const upload = multer({
  fileFilter: function (req, file, cb) {
    cb(null, true);
  }
}).any();

const controller = require("../controllers/snap.controller");

router.get('/test', controller.test);

router.post('/upload',
  upload,
  uploadCloud.upload,
  controller.upload
);

router.delete('/delete/:id', controller.delete);

module.exports = router;
