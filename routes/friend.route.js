const express = require('express');
const router = express.Router();

const controller = require("../controllers/friend.controller");

router.get('/list', controller.getFriendList);

router.post('/request/:id', controller.sendFriendRequest);
router.delete('/cancel-request/:id', controller.cancelFriendRequest);
router.get('/request/incoming', controller.getIncomingFriendRequest);
router.get('/request/outgoing', controller.getOutgoingFriendRequest);

router.post('/accept/:id', controller.acceptFriendRequest);
router.post('/reject/:id', controller.rejectFriendRequest);

router.delete('/remove/:id', controller.unfriend);

module.exports = router;
