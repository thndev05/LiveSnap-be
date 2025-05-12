const admin = require('firebase-admin');
const User = require('../models/user.model');

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
}

module.exports = FirebaseService; 