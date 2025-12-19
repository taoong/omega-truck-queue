# Omega Products Truck Queue Management System

A real-time truck queue management system built with React and Firebase for Omega Products International in Corona, California.

## 🚛 Overview

This system consists of **two separate applications** as specified in the requirements:

### 📱 **Driver Mobile App** (`/`)
- **No login required** - Anonymous access for truck drivers
- Mobile-optimized interface for smartphones
- Join queue with PO number and confirmation code
- Check status by PO number
- Real-time notifications and updates
- Capacitor-ready for iOS/Android deployment

### 💻 **Admin Web Portal** (`/admin-app`)
- **Login required** - Admin authentication
- Desktop web interface for Omega operators
- Approve/reject driver requests
- Manage queue order with drag-and-drop
- Real-time queue monitoring
- Complete activity logs and audit trail

## 🏗️ Architecture

The system addresses the upcoming street design changes that will eliminate outside parking for trucks. It provides:

## 🏗️ Architecture

### Frontend
- **React 19** with modern hooks and context
- **Tailwind CSS** for responsive, modern UI
- **Lucide React** for consistent iconography
- **Capacitor** for mobile app deployment

### Backend
- **Firebase Authentication** for user management
- **Firestore Database** for real-time data storage
- **Firebase Cloud Messaging** for push notifications
- **Real-time listeners** for live updates

### State Management
- **React Context** with useReducer for global state
- **Real-time subscriptions** to Firebase collections
- **Optimistic updates** for better UX

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Firebase project (configured in `src/config/firebase.js`)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/taoong/omega-truck-queue.git
   cd omega-truck-queue
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Firebase**
   - Update `src/config/firebase.js` with your Firebase project credentials
   - Set up Firestore security rules (see Firebase Setup section)

4. **Start development servers**
   
   **Driver App (Mobile Interface):**
   ```bash
   npm run dev
   # Opens at http://localhost:5173
   ```
   
   **Admin App (Web Portal):**
   ```bash
   npm run dev:admin
   # Opens at http://localhost:3001
   ```

5. **Open in browsers**
   - **Driver App**: `http://localhost:5173` (mobile-optimized)
   - **Admin Portal**: `http://localhost:3001` (desktop web interface)

## 🔥 Firebase Setup

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Enable Authentication and Firestore Database

### 2. Configure Authentication
Enable Email/Password authentication in Firebase Console:
- Go to Authentication > Sign-in method
- Enable "Email/Password"

### 3. Firestore Database Structure
The app creates these collections automatically:
```
/users/{userId}
  - uid: string
  - email: string  
  - role: "driver" | "admin"
  - driverName: string
  - createdAt: timestamp

/queue/{queueId}
  - driverName: string
  - poNumber: string
  - confirmCode: string
  - status: "queued" | "summoned" | "staging" | "loading" | "completed"
  - position: number
  - userId: string
  - joinedAt: timestamp

/pendingRequests/{requestId}
  - driverName: string
  - poNumber: string
  - confirmCode: string
  - userId: string
  - requestedAt: timestamp

/notifications/{notificationId}
  - userId: string
  - type: string
  - message: string
  - poNumber: string
  - timestamp: timestamp
  - read: boolean

/activityLogs/{logId}
  - type: string
  - message: string
  - poNumber: string
  - timestamp: timestamp
  - userId: string
```

### 4. Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Queue items - drivers can read, admins can read/write
    match /queue/{queueId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Pending requests - drivers can create, admins can read/write
    match /pendingRequests/{requestId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == resource.data.userId;
      allow update, delete: if request.auth != null && 
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Notifications - users can read their own, admins can read/write all
    match /notifications/{notificationId} {
      allow read, write: if request.auth != null && 
        (request.auth.uid == resource.data.userId || 
         (exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
          get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'));
    }
    
    // Activity logs - admins only
    match /activityLogs/{logId} {
      allow read, write: if request.auth != null && 
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

## 👥 User Accounts

### Demo Accounts
For testing, create these accounts in Firebase Authentication:

**Admin Account:**
- Email: `admin@omega.com`
- Password: `password`
- Role: `admin`

**Driver Account:**
- Email: `driver@omega.com`  
- Password: `password`
- Role: `driver`
- Driver Name: `John Doe`

### Creating Accounts
Users can sign up through the app, or you can create them manually in Firebase Console.

## 🎯 Features

### Driver Features
- ✅ Join queue with PO number and confirmation code
- ✅ Real-time queue position and wait time
- ✅ Status notifications (approved, summoned, etc.)
- ✅ View notification history
- ✅ Nearby parking area information

### Admin Features  
- ✅ Approve/reject join requests with reasons
- ✅ Drag-and-drop queue reordering
- ✅ Remove trucks from queue
- ✅ Real-time queue management
- ✅ Complete activity log with timestamps
- ✅ Pending request notifications

### Technical Features
- ✅ Real-time data synchronization
- ✅ Offline-capable with Firebase caching
- ✅ Responsive design for mobile/desktop
- ✅ Role-based access control
- ✅ Secure Firestore rules
- ✅ Modern React patterns (hooks, context)

## 📱 Mobile Deployment

### iOS App
```bash
npm run build
npx cap add ios
npx cap copy ios
npx cap open ios
```

### Android App  
```bash
npm run build
npx cap add android
npx cap copy android
npx cap open android
```

## 🛠️ Development

### Available Scripts

#### Driver App (Main)
- `npm run dev` - Start driver app dev server (port 5173)
- `npm run build` - Build driver app for production
- `npm run preview` - Preview driver app production build

#### Admin App
- `npm run dev:admin` - Start admin app dev server (port 3001)
- `npm run build:admin` - Build admin app for production
- `npm run preview:admin` - Preview admin app production build

#### Both Apps
- `npm run build:all` - Build both apps for production
- `npm run lint` - Run ESLint on both apps

### Project Structure
```
├── src/                     # Driver Mobile App
│   ├── services/
│   │   └── driverFirebaseService.js  # Driver-specific Firebase operations
│   ├── config/
│   │   └── firebase.js              # Firebase configuration
│   ├── DriverApp.jsx               # Main driver app component
│   ├── App.jsx                     # App entry point
│   ├── main.jsx                    # React entry point
│   └── index.css                   # Global styles
│
├── admin-app/               # Admin Web Portal
│   ├── src/
│   │   ├── services/
│   │   │   └── adminFirebaseService.js  # Admin-specific Firebase operations
│   │   ├── config/
│   │   │   └── firebase.js             # Firebase configuration
│   │   ├── AdminApp.jsx               # Main admin app component
│   │   ├── main.jsx                   # React entry point
│   │   └── index.css                  # Global styles
│   ├── package.json                   # Admin app dependencies
│   ├── vite.config.js                # Admin app build config
│   └── index.html                    # Admin app HTML template
│
├── services/                # Shared services (legacy)
│   ├── locationService.js    # Location tracking
│   ├── notificationService.js # Push notifications
│   └── queueService.js       # Queue management
└── README.md                # This file
```

## 🔒 Security

- **Authentication**: Firebase Auth with email/password
- **Authorization**: Role-based access (driver/admin)
- **Data Security**: Firestore security rules
- **Input Validation**: Client and server-side validation
- **Real-time Security**: User-specific data subscriptions

## 📊 Queue State Machine

The queue system implements a state machine with these states:

1. **Pending**: Driver submitted info, waiting for admin approval
2. **Queued**: Approved, waiting for a spot  
3. **Summoned**: Top of the list, told to head to facility
4. **Staging**: Currently in the 2-truck staging zone
5. **Loading**: In one of the 3 loading bays
6. **Completed/Expired**: Left facility or kicked for inactivity

## 🚀 Deployment

### Web Deployment
The app can be deployed to any static hosting service:
- **Firebase Hosting**: `firebase deploy`
- **Vercel**: Connect GitHub repo
- **Netlify**: Connect GitHub repo

### Environment Variables
No environment variables needed - Firebase config is in the code.

## 📞 Support

For issues or questions:
1. Check the [Issues](https://github.com/taoong/omega-truck-queue/issues) page
2. Create a new issue with detailed description
3. Contact the development team

## 📄 License

This project is proprietary software for Omega Products International.

---

**Built with ❤️ for Omega Products International**