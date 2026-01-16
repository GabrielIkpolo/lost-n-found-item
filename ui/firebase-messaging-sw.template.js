importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// 1. Initialize Firebase (Use the SAME config as .env, but hardcoded here is often easier 
//    because service workers don't access Vite env vars easily without build steps)
//    REPLACE THESE VALUES WITH YOUR ACTUAL FIREBASE CONFIG
const firebaseConfig = {
  apiKey: "${VITE_FIREBASE_API_KEY}",
  authDomain: "${VITE_FIREBASE_AUTH_DOMAIN}",
  projectId: "${VITE_FIREBASE_PROJECT_ID}",
  storageBucket: "${VITE_FIREBASE_STORAGE_BUCKET}",
  messagingSenderId: "${VITE_FIREBASE_MESSAGING_SENDER_ID}",
  appId: "${VITE_FIREBASE_APP_ID}"
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