# LiveSnap 📸

LiveSnap is a real-time photo sharing application that enables instant sharing of moments with friends, similar to Locket. Capture and share your daily moments with a unique social experience.

## 🎓 Project Information
This is a year 2 final project (Project 3) at VKU – University of Information and Communication Technology, Vietnam-Korea University of Information and Communication Technology.

## 👨‍💻 Developers
- Huỳnh Quốc Khánh
- Trần Hoàng Nhật

## 🚀 Features

### Core Features
- Real-time photo sharing with friends
- User authentication and profile management
- Friend management system
- In-app messaging
- Push notifications for new snaps and messages
- Image upload and storage
- Real-time updates using Firebase

### Technical Features
- Secure user authentication with JWT
- Cloud storage integration with Cloudinary
- Real-time notifications using Firebase Cloud Messaging
- RESTful API architecture
- Cross-origin resource sharing (CORS) support
- MongoDB database integration
- Email notifications using Nodemailer

## 🛠 Tech Stack

### Backend
- Node.js & Express.js
- MongoDB with Mongoose
- Firebase Admin SDK
- Cloudinary for image storage
- JWT for authentication
- Nodemailer for email notifications
- Multer for file uploads

### Frontend (Android)
- Kotlin
- MVVM Architecture
- Jetpack Compose
- Hilt for dependency injection
- Retrofit for networking
- Coil for image loading
- Firebase for real-time features

## 📋 Prerequisites

### Backend
- Node.js (v14 or higher)
- MongoDB
- Firebase project setup
- Cloudinary account
- Environment variables configured

### Android
- Android Studio Arctic Fox or newer
- JDK 17
- Android SDK 33 or newer
- Kotlin 1.8.0 or newer

## 🚀 Getting Started

### Backend Setup
1. Clone the repository
```bash
git clone https://github.com/thndev05/LiveSnap-be.git
```

2. Install dependencies
```bash
npm install
```

3. Configure environment variables
Create a `.env` file with the following variables:
```
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
FIREBASE_PROJECT_ID=your_project_id
```

4. Start the development server
```bash
npm run dev
```

### Android Setup
1. Clone the Android repository
```bash
git clone https://github.com/HuynhKhanh1402/livesnap-android.git
```

2. Open the project in Android Studio
3. Add your Firebase configuration
   - Create a new Firebase project
   - Add your `google-services.json` to the app directory
   - Enable Storage and Cloud Messaging
4. Build and run the app

## 🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License
This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments
- Inspired by Locket app
- Thanks to all contributors who have helped shape this project 