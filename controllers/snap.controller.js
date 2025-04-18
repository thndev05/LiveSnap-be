const Snap = require('../models/snap.model');
const apiResponse = require('../helpers/response');
const Friend = require('../models/friend.model');

// [GET]: BASE_URL/api/snaps/test
module.exports.test = async (req, res) => {
  try {
    const currentUserId = req.user?._id?.toString();
    console.log(req.user.email)

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const snaps = await Snap.find({ deleted: false })
        .skip(skip)
        .limit(limit)
        .populate({
          path: 'userId',
          select: 'username email firstName lastName avatar',
        });

    const formattedSnaps = snaps.map(snap => {
      const user = snap.userId;
      const isOwner = user._id.toString() === currentUserId;

      return {
        ...snap.toObject(),
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          avatar: user.avatar
        },
        isOwner,
        userId: undefined
      };
    });

    const total = await Snap.countDocuments({ deleted: false });

    return apiResponse(res, 200, 'Get snaps successfully', {
      snaps: formattedSnaps,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (e) {
    return apiResponse(res, 400, 'Get snaps failed');
  }
};

// [POST]: BASE_URL/api/snaps/upload
module.exports.upload = async (req, res) => {
  try {
    const { caption } = req.body;
    const userId = req.user._id;
    const image = req.body.files[0].image;

    if (!image) {
      return apiResponse(res, 400, 'File is required');
    }

    const data = {
      userId: userId,
      caption: caption,
      image: image
    }
    const newSnap = new Snap(data);
    await newSnap.save();

    return apiResponse(res, 200, 'Upload snap successfully.', newSnap);

  } catch (error) {
    console.error('Upload Snap Error:', error);
    return apiResponse(res, 200, 'Server error.');
  }
}

// [DELETE]: BASE_URL/api/snaps/delete/:id
module.exports.delete = async (req, res) => {
  try {
    const snapId = req.params.id;
    const snap = await Snap.findById(snapId);

    if (!snap) {
      return apiResponse(res, 400, 'SnapID is invalid.');
    } else {
      await snap.updateOne({
        deleted: true
      });

      return apiResponse(res, 200, 'Delete snap successfully.');
    }

  } catch (error) {
    console.error('Upload Snap Error:', error);
    return apiResponse(res, 400, 'Server error.');
  }
}

// [GET]: BASE_URL/api/snaps/load
module.exports.loadSnaps = async (req, res) => {
  try {
    const userId = req.user._id;

    const friendships = await Friend.find({
      userId: userId,
      status: 'accepted'
    });

    const friendWithDate = friendships.map(f => {
      const friendId = f.userId.toString() === userId.toString() ? f.friendId : f.userId;
      return {
        friendId,
        friendSince: f.friendSince
      };
    });

    const snapConditions = friendWithDate.map(f => ({
      userId: f.friendId,
      createdAt: { $gte: f.friendSince }
    }));

    snapConditions.push({ userId: userId });

    const snaps = await Snap.find({ $or: snapConditions })
      .populate('userId', 'firstName avatar')
      .sort({ createdAt: -1 });

    return apiResponse(res, 200, 'Loaded snaps successfully.', snaps);
  } catch (e) {
    console.error('Load snaps error:', e);
    return apiResponse(res, 500, 'Failed to load snaps.');
  }
};

// [POST]: BASE_URL/api/snaps/upload
module.exports.react = async (req, res) => {
  try {
    const { snapId, type } = req.body;
    const userReactionId = req.user._id;

    const snap = await Snap.findById(snapId);

    if(!snap) {
      return apiResponse(res, 400, 'Cannot find the snap');
    }

    if (snap.userId.toString() === userReactionId.toString()) {
      return apiResponse(res, 400, 'Cannot self-react snap');
    }

    if(type) {
      const existingReaction = snap.reactions.find(
        (r) => r.userReactionId.toString() === userReactionId.toString()
      );

      if (existingReaction) {
        existingReaction.type = type;
        existingReaction.reactedAt = new Date();
      } else {
        snap.reactions.push({
          userReactionId,
          type,
        });
      }
      await snap.save();

      return apiResponse(res, 200, 'Reaction updated.');
    } else {
      return apiResponse(res, 400, 'Sent reaction is error.');
    }
  } catch (error) {
    return apiResponse(res, 400, 'Server error.');
  }
}