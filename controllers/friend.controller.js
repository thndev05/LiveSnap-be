const Friend = require('../models/friend.model');
const apiResponse = require('../helpers/response');

// [POST]: BASE_URL/api/friends/request/:id
module.exports.sendFriendRequest = async (req, res) => {
  try {
    const friendId = req.params.id;
    const userId = req.user?._id;

    if (!friendId || !userId) {
      return apiResponse(res, 400, 'Missing userId or friendId.');
    }

    if (userId.toString() === friendId) {
      return apiResponse(res, 400, 'You cannot send a friend request to yourself.');
    }

    const exists = await Friend.findOne({
      $or: [
        { userId, friendId },
        { userId: friendId, friendId: userId }
      ],
      status: { $in: ['pending', 'accepted'] }
    });

    if (exists) {
      return apiResponse(res, 400, 'Friend request already sent or already friends.');
    }

    const request = new Friend({ userId, friendId });
    await request.save();

    return apiResponse(res, 200, 'Friend request sent successfully.');
  } catch (err) {
    console.error('Send Friend Request Error:', err);
    return apiResponse(res, 500, 'Server error.');
  }
};

// [GET]: BASE_URL/api/friends/request/incoming
module.exports.getIncomingFriendRequest = async (req, res) => {
  try {
    const userId = req.user?._id;

    const requests = await Friend.find({
      friendId: userId,
      status: 'pending'
    }).select('friendId')
      .populate('userId', 'username avatar firstName lastName');

    return apiResponse(res, 200, 'Incoming friend requests fetched.', { requests });
  } catch (err) {
    console.error('Get Incoming Friend Requests Error:', err);
    return apiResponse(res, 500, 'Server error.');
  }
};

// [GET]: BASE_URL/api/friends/request/outgoing
module.exports.getOutgoingFriendRequest = async (req, res) => {
  try {
    const userId = req.user?._id;

    const requests = await Friend.find({
      userId,
      status: 'pending'
    }).select('userId')
      .populate('friendId', 'username avatar firstName lastName');

    return apiResponse(res, 200, 'Outgoing friend requests fetched.', { requests });
  } catch (err) {
    console.error('Get Outgoing Friend Requests Error:', err);
    return apiResponse(res, 500, 'Server error.');
  }
};

// [GET]: BASE_URL/api/friends/list
module.exports.getFriendList = async (req, res) => {
  try {
    const userId = req.user._id;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    const friends = await Friend.find({
      status: 'accepted',
      $or: [
        { userId: userId },
        { friendId: userId }
      ]
    })
        .select('userId friendId friendSince')
        .populate('userId', 'username avatar firstName lastName')
        .populate('friendId', 'username avatar firstName lastName')
        .skip(offset)
        .limit(limit);

    const formattedFriends = friends.map(friend => {
      const isCurrentUserUserId = String(friend.userId._id) === String(userId);
      const other = isCurrentUserUserId ? friend.friendId : friend.userId;

      return {
        id: other._id,
        username: other.username,
        avatar: other.avatar,
        firstName: other.firstName,
        lastName: other.lastName,
        friendSince: friend.friendSince
      };
    });

    return apiResponse(res, 200, 'Get friends successfully', formattedFriends);
  } catch (err) {
    console.error('Get Friends Error:', err);
    return apiResponse(res, 500, 'Server error.');
  }
};


// [POST] /api/friends/accept/:friendId
module.exports.acceptFriendRequest = async (req, res) => {
  try {
    const userId = req.user._id;
    const friendId = req.params.id;

    const request = await Friend.findOne({
      userId: friendId,
      friendId: userId,
      status: 'pending'
    });

    if (!request) {
      return apiResponse(res, 400, 'No matching friend requests found.');
    }

    request.status = 'accepted';
    const friendSinceTime = new Date();
    request.friendSince = friendSinceTime;
    await request.save();

    const exists = await Friend.findOne({
      userId: userId,
      friendId: friendId
    });

    if (!exists) {
      await new Friend({
        userId: userId,
        friendId: friendId,
        status: 'accepted',
        friendSince: friendSinceTime
      }).save();
    }

    return apiResponse(res, 200, 'Friend request accepted.');
  } catch (error) {
    console.error('Accept Friend Error:', error);
    return apiResponse(res, 400, 'Server error.');
  }
};

// [POST] /api/friends/reject/:friendId
module.exports.rejectFriendRequest = async (req, res) => {
  try {
    const userId = req.user._id;
    const friendId = req.params.id                                                ;

    const request = await Friend.findOne({
      userId: friendId,
      friendId: userId,
      status: 'pending'
    });

    if (!request) {
      return apiResponse(res, 400, 'No matching friend requests found.');
    }

    request.status = 'rejected';
    await request.save();

    return apiResponse(res, 200, 'Friend request rejected.');
  } catch (error) {
    console.error('Reject Friend Error:', error);
    return apiResponse(res, 400, 'Server error.');
  }
};

// [DELETE]: /api/friends/cancel-request/:id
module.exports.cancelFriendRequest = async (req, res) => {
  try {
    const userId = req.user._id;
    const friendId = req.params.id;

    const request = await Friend.findOneAndDelete({
      userId,
      friendId,
      status: 'pending'
    });

    if (!request) {
      return apiResponse(res, 400, 'No pending friend request found to cancel.');
    }

    return apiResponse(res, 200, 'Friend request cancelled successfully.');
  } catch (err) {
    console.error('Cancel Friend Request Error:', err);
    return apiResponse(res, 400, 'Server error.');
  }
};

// [DELETE]: /api/friends/remove/:id
module.exports.unfriend = async (req, res) => {
  try {
    const userId = req.user._id;
    const friendId = req.params.id;

    const deleted = await Friend.deleteMany({
      $or: [
        { userId: userId, friendId: friendId, status: 'accepted' },
        { userId: friendId, friendId: userId, status: 'accepted' }
      ]
    });

    if (deleted.deletedCount === 0) {
      return apiResponse(res, 400, 'No friendship found to delete.');
    }

    return apiResponse(res, 200, 'Unfriended successfully.');
  } catch (err) {
    console.error('Unfriend Error:', err);
    return apiResponse(res, 400, 'Server error.');
  }
};
