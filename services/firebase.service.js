const admin = require('firebase-admin');
const User = require('../models/user.model');
const Friend = require('../models/friend.model');

// Khởi tạo Firebase Admin SDK
const serviceAccount = require('../firebase-service-account.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

class FirebaseService {
  static async sendNotification(userId, title, body, data = {}) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.fcmToken) {
        console.log('User not found or no FCM token');
        return;
      }

      const message = {
        notification: {
          title,
          body
        },
        data: {
          ...data,
          click_action: 'FLUTTER_NOTIFICATION_CLICK'
        },
        token: user.fcmToken
      };

      const response = await admin.messaging().send(message);
      console.log('Successfully sent notification:', response);
      return response;
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }

  static async sendFriendRequestNotification(senderId, receiverId) {
    try {
      const sender = await User.findById(senderId);
      if (!sender) return;

      const title = 'New Friend Request';
      const body = `${sender.firstName} ${sender.lastName} sent you a friend request`;
      const data = {
        type: 'FRIEND_REQUEST',
        senderId: senderId.toString()
      };

      await this.sendNotification(receiverId, title, body, data);
    } catch (error) {
      console.error('Error sending friend request notification:', error);
    }
  }

  static async sendFriendRequestAcceptedNotification(accepterId, requesterId) {
    try {
      const accepter = await User.findById(accepterId);
      if (!accepter) return;

      const title = 'Friend Request Accepted';
      const body = `${accepter.firstName} ${accepter.lastName} accepted your friend request`;
      const data = {
        type: 'FRIEND_REQUEST_ACCEPTED',
        accepterId: accepterId.toString()
      };

      await this.sendNotification(requesterId, title, body, data);
    } catch (error) {
      console.error('Error sending friend request accepted notification:', error);
    }
  }

  static async sendSnapReactionNotification(reactorId, snapOwnerId, emoji) {
    try {
      const reactor = await User.findById(reactorId);
      if (!reactor) return;

      const title = 'New Snap Reaction';
      const body = `${reactor.firstName} ${reactor.lastName} reacted ${emoji} to your snap`;
      const data = {
        type: 'SNAP_REACTION',
        reactorId: reactorId.toString(),
        emoji: emoji
      };

      await this.sendNotification(snapOwnerId, title, body, data);
    } catch (error) {
      console.error('Error sending snap reaction notification:', error);
    }
  }

  static async sendNewSnapNotification(snapOwnerId, snapId) {
    try {
      const snapOwner = await User.findById(snapOwnerId);
      if (!snapOwner) return;

      // Get all friends of the snap owner
      const friendships = await Friend.find({
        $or: [
          { userId: snapOwnerId, status: 'accepted' },
          { friendId: snapOwnerId, status: 'accepted' }
        ]
      });

      // Get friend IDs
      const friendIds = friendships.map(f => 
        f.userId.toString() === snapOwnerId.toString() ? f.friendId : f.userId
      );

      const title = 'New Snap';
      const body = `${snapOwner.firstName} ${snapOwner.lastName} posted a new snap`;
      const data = {
        type: 'NEW_SNAP',
        snapId: snapId.toString(),
        snapOwnerId: snapOwnerId.toString()
      };

      // Send notification to all friends
      for (const friendId of friendIds) {
        await this.sendNotification(friendId, title, body, data);
      }
    } catch (error) {
      console.error('Error sending new snap notification:', error);
    }
  }
}

module.exports = FirebaseService; 