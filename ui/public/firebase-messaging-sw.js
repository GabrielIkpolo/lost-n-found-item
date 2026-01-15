importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// 1. Initialize Firebase (Use the SAME config as .env, but hardcoded here is often easier 
//    because service workers don't access Vite env vars easily without build steps)
//    REPLACE THESE VALUES WITH YOUR ACTUAL FIREBASE CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyCU1KKODDD5AvAX8H5cBFYUfTWveVuZebo",
  authDomain: "push-notification-f4aaa.firebaseapp.com",
  projectId: "push-notification-f4aaa",
  storageBucket: "push-notification-f4aaa.firebasestorage.app",
  messagingSenderId: "422910494764",
  appId: "1:422910494764:web:bedc2820c29425c462e989"
};

firebase.initializeApp(firebaseConfig);

// 2. Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  // Customize notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/adeleke-icon.jpg', // Ensure this icon exists in public folder
    data: payload.data // Pass data for click handling
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});