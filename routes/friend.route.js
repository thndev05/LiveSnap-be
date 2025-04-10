const express = require('express');
const router = express.Router();

const controller = require("../controllers/friend.controller");

router.get('/list', controller.getFriendList);

router.post('/request', controller.sendFriendRequest);
router.get('/request/incoming', controller.getIncomingFriendRequest);
router.get('/request/outgoing', controller.getOutgoingFriendRequest);

module.exports = router;
