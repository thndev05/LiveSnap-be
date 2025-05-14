const Friend = require('../models/friend.model');
const apiResponse = require('../helpers/response');
const FirebaseService = require('../services/firebase.service');

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

// [GET]: /api/friends/suggestions
module.exports.getFriendSuggestions = async (req, res) => {
  try {
    const userId = req.user._id;
    const limit = 5;

    // Lấy danh sách bạn bè hiện tại của user
    const userFriends = await Friend.find({
      status: 'accepted',
      $or: [
        { userId: userId },
        { friendId: userId }
      ]
    });

    // Tạo mảng chứa ID của tất cả bạn bè
    const friendIds = userFriends.map(friend => 
      String(friend.userId) === String(userId) ? friend.friendId : friend.userId
    );

    // Tìm tất cả bạn bè của bạn bè (friends of friends)
    const friendsOfFriends = await Friend.find({
      status: 'accepted',
      $or: [
        { userId: { $in: friendIds } },
        { friendId: { $in: friendIds } }
      ]
    });

    // Tạo map để đếm số bạn chung
    const mutualFriendsCount = new Map();
    
    friendsOfFriends.forEach(fof => {
      const potentialFriendId = String(fof.userId) === String(friendIds[0]) ? fof.friendId : fof.userId;
      
      // Bỏ qua nếu là chính user hoặc đã là bạn
      if (String(potentialFriendId) === String(userId) || friendIds.includes(String(potentialFriendId))) {
        return;
      }

      mutualFriendsCount.set(
        String(potentialFriendId),
        (mutualFriendsCount.get(String(potentialFriendId)) || 0) + 1
      );
    });

    // Chuyển map thành mảng và sắp xếp theo số bạn chung
    const suggestions = Array.from(mutualFriendsCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([id]) => id);

    // Lấy thông tin chi tiết của các user được gợi ý
    const suggestedUsers = await Friend.find({
      $or: [
        { userId: { $in: suggestions } },
        { friendId: { $in: suggestions } }
      ],
      status: 'accepted'
    })
    .populate('userId', 'username avatar firstName lastName')
    .populate('friendId', 'username avatar firstName lastName');

    // Format kết quả và loại bỏ những người đã là bạn
    const formattedSuggestions = suggestions
      .map(suggestedId => {
        const user = suggestedUsers.find(u => 
          String(u.userId._id) === String(suggestedId) || String(u.friendId._id) === String(suggestedId)
        );
        
        if (!user) return null;
        
        const userInfo = String(user.userId._id) === String(suggestedId) ? user.userId : user.friendId;
        
        // Kiểm tra xem người dùng này đã là bạn chưa
        const isAlreadyFriend = friendIds.includes(String(userInfo._id));
        if (isAlreadyFriend) return null;
        
        return {
          user: {
            id: userInfo._id,
            username: userInfo.username,
            avatar: userInfo.avatar,
            firstName: userInfo.firstName,
            lastName: userInfo.lastName
          },
          mutualFriends: mutualFriendsCount.get(String(suggestedId))
        };
      })
      .filter(Boolean); // Loại bỏ các giá trị null

    return apiResponse(res, 200, 'Friend suggestions fetched successfully', formattedSuggestions);
  } catch (err) {
    console.error('Get Friend Suggestions Error:', err);
    return apiResponse(res, 500, 'Server error.');
  }
};
