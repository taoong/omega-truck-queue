// import { PushNotifications } from '@capacitor/push-notifications';
// import { LocalNotifications } from '@capacitor/local-notifications';
// import { Capacitor } from '@capacitor/core';

// export async function initializePushNotifications() {
//   // Only works on actual devices, not web
//   if (!Capacitor.isNativePlatform()) {
//     console.log('Push notifications only work on native platforms');
//     return;
//   }

//   // Request permission
//   let permStatus = await PushNotifications.requestPermissions();

//   if (permStatus.receive !== 'granted') {
//     console.log('Push notification permission denied');
//     return;
//   }

//   // Register with Apple / Google
//   await PushNotifications.register();

//   // Listen for registration token
//   await PushNotifications.addListener('registration', (token) => {
//     console.log('Push registration token:', token.value);
//     // Send this token to your backend to send notifications
//     saveFCMToken(token.value);
//   });

//   // Listen for registration errors
//   await PushNotifications.addListener('registrationError', (error) => {
//     console.error('Push registration error:', error);
//   });

//   // Handle notification received
//   await PushNotifications.addListener(
//     'pushNotificationReceived',
//     (notification) => {
//       console.log('Push received:', notification);
//       // Show local notification if app is in foreground
//       showLocalNotification(notification.title, notification.body);
//     }
//   );

//   // Handle notification tapped
//   await PushNotifications.addListener(
//     'pushNotificationActionPerformed',
//     (notification) => {
//       console.log('Push action performed:', notification);
//       // Navigate to relevant screen based on notification data
//     }
//   );
// }

// async function showLocalNotification(title, body) {
//   await LocalNotifications.schedule({
//     notifications: [
//       {
//         title,
//         body,
//         id: Date.now(),
//         schedule: { at: new Date(Date.now() + 100) }
//       }
//     ]
//   });
// }

// async function saveFCMToken(token) {
//   // Save to your backend/Firestore
//   // This will be used to send notifications to this specific device
//   // We'll implement this in the backend section
// }

// // Send notification via Firebase Cloud Functions (backend)
// export async function sendNotificationToUser(userId, title, body, data = {}) {
//   // This will be called from your backend
//   // For now, we'll use local notifications for testing
//   await showLocalNotification(title, body);
// }