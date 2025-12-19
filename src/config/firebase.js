import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getMessaging } from 'firebase/messaging';

const firebaseConfig = {
    apiKey: "AIzaSyB5i9OCUpp-VQ9MR4fk01zsP743UuHSVWw",
    authDomain: "omega-cf92a.firebaseapp.com",
    projectId: "omega-cf92a",
    storageBucket: "omega-cf92a.firebasestorage.app",
    messagingSenderId: "187395193452",
    appId: "1:187395193452:web:5c0f4aefb2407478687649",
    measurementId: "G-5114W3WLXR"
  };

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const messaging = getMessaging(app);