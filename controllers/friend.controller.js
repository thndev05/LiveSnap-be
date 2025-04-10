const Friend = require('../models/friend.model');
const apiResponse = require('../helpers/response');

// [POST]: BASE_URL/api/friends/request
module.exports.sendFriendRequest = async (req, res) => {
  try {
    const { friendId } = req.body;
    const userId = req.user?._id;

    if (!friendId || !userId) {
      return apiResponse(res, 400, 'Missing userId or friendId.');
    }

    if (userId.toString() === friendId) {
      return apiResponse(res, 400, 'You cannot send friend request to yourself.');
    }

    const exists = await Friend.findOne({
      $or: [
        { userId, friendId },
        { userId: friendId, friendId: userId }
      ]
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

    const friends = await Friend.find({
      $or: [
        { userId: userId },
        { friendId: userId }
      ],
      status: 'accepted'
    })
      .populate('userId', 'username avatar firstName lastName')
      .populate('friendId', 'username avatar firstName lastName');

    // Lọc ra người còn lại (không phải mình)
    const friendList = friends.map(item => {
      const friend = item.userId._id.toString() === userId.toString()
        ? item.friendId
        : item.userId;
      return friend;
    });

    return apiResponse(res, 200, 'Get friends successfully', { friends: friendList });
  } catch (err) {
    console.error('Get Friends Error:', err);
    return apiResponse(res, 400, 'Server error.');
  }
};
