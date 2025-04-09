const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');
const controller = require("../controllers/user.controller");

router.post('/register', controller.register);
router.post('/login', controller.login);
router.get('/detail',
  authMiddleware.requireAuth,
  controller.detail
);

module.exports = router;
