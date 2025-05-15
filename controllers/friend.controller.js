const Friend = require('../models/friend.model');
const apiResponse = require('../helpers/response');
const FirebaseService = require('../services/firebase.service');
const mongoose = require('mongoose');

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
      if (exists.status === 'accepted') {
        return apiResponse(res, 400, 'You are already friends.');
      } else {
        return apiResponse(res, 400, 'Friend request already sent.');
      }
    }

    const request = new Friend({ userId, friendId });
    await request.save();

    // Gửi thông báo cho người nhận yêu cầu kết bạn
    await FirebaseService.sendFriendRequestNotification(userId, friendId);

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
    })
        .populate('userId', 'username avatar firstName lastName');

    const formattedRequests = requests.map((req) => ({
      id: req._id,
      user: {
        id: req.userId._id,
        username: req.userId.username,
        avatar: req.userId.avatar,
        firstName: req.userId.firstName,
        lastName: req.userId.lastName
      }
    }));

    return apiResponse(res, 200, 'Incoming friend requests fetched.', {
      requests: formattedRequests
    });
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
    })
        .select('userId friendId')
        .populate('friendId', 'username avatar firstName lastName');

    const formattedRequests = requests.map(req => {
      const obj = req.toObject();
      return {
        id: obj._id,
        user: obj.friendId ? {
          id: obj.friendId._id,
          username: obj.friendId.username,
          firstName: obj.friendId.firstName,
          lastName: obj.friendId.lastName,
          avatar: obj.friendId.avatar,
        } : null
      };
    });

    return apiResponse(res, 200, 'Outgoing friend requests fetched.', { requests: formattedRequests });
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
        .populate('userId', 'username avatar firstName lastName isGold')
        .populate('friendId', 'username avatar firstName lastName isGold')
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
        isGold: other.isGold,
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
    request.friendSince = new Date();
    await request.save();

    // Gửi thông báo cho người gửi yêu cầu kết bạn
    await FirebaseService.sendFriendRequestAcceptedNotification(userId, friendId);

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

// [GET] /api/friends/suggestions
module.exports.getFriendSuggestions = async (req, res) => {
  try {
    const userId = req.user._id;

    const friends = await Friend.find({
      status: 'accepted',
      $or: [
        { userId },
        { friendId: userId }
      ]
    }).select('userId friendId').lean();

    const friendIdSet = new Set();
    friends.forEach(f => {
      const uid = f.userId.toString();
      const fid = f.friendId.toString();
      if (uid === userId.toString()) friendIdSet.add(fid);
      else friendIdSet.add(uid);
    });

    const friendIds = Array.from(friendIdSet).map(id => new mongoose.Types.ObjectId(id));

    const raw = await Friend.aggregate([
      { $match: {
          status: 'accepted',
          $or: [
            { userId: { $in: friendIds } },
            { friendId: { $in: friendIds } }
          ]
        }},
      { $project: {
          other: {
            $cond: [
              { $in: ['$userId', friendIds] },
              '$friendId',
              '$userId'
            ]
          }
        }},
      { $match: {
          other: {
            $ne: userId,
            $nin: friendIds
          }
        }},
      { $group: {
          _id: '$other',
          mutualCount: { $sum: 1 }
        }},
      { $sort: { mutualCount: -1 } },
      { $limit: 5 },
      { $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }},
      { $unwind: '$user' },
      { $project: {
          _id: 0,
          user: {
            id: '$_id',
            username: '$user.username',
            firstName: '$user.firstName',
            lastName: '$user.lastName',
            avatar: '$user.avatar',
            isGold: '$user.isGold'
          },
          mutualCount: 1
        }}
    ]);

    return apiResponse(res, 200, 'Friend suggestions fetched successfully.', {
      suggestions: raw
    });
  } catch (err) {
    console.error('Get Friend Suggestions Error:', err);
    return apiResponse(res, 500, 'Server error.');
  }
};