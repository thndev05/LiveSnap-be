const express = require('express');
const router = express.Router();

const controller = require("../controllers/user.controller");

router.get('/test', controller.test);
router.post('/register', controller.register);

module.exports = router;
