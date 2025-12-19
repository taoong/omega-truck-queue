// Setup script to create admin user in Firebase
// Run this script once to set up the admin user

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

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
const db = getFirestore(app);
const auth = getAuth(app);

async function setupAdminUser() {
    const adminEmail = 'admin@omega.com';
    const adminPassword = 'password';
    
    try {
        console.log('Setting up admin user...');
        
        // Check if admin user profile already exists
        const userQuery = query(
            collection(db, 'users'),
            where('email', '==', adminEmail)
        );
        const existingUser = await getDocs(userQuery);
        
        if (!existingUser.empty) {
            console.log('✅ Admin user profile already exists in Firestore');
            return;
        }
        
        // Create admin user in Authentication (if doesn't exist)
        let userCredential;
        try {
            userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
            console.log('✅ Admin user created in Firebase Auth');
        } catch (error) {
            if (error.code === 'auth/email-already-in-use') {
                console.log('ℹ️ Admin user already exists in Firebase Auth');
                // We still need to create the Firestore profile
                userCredential = { user: { uid: 'temp-uid', email: adminEmail } };
            } else {
                throw error;
            }
        }
        
        // Create admin profile in Firestore
        const adminProfile = {
            uid: userCredential.user.uid,
            email: adminEmail,
            role: 'admin',
            driverName: '',
            createdAt: serverTimestamp(),
            isActive: true
        };
        
        await addDoc(collection(db, 'users'), adminProfile);
        console.log('✅ Admin user profile created in Firestore');
        
        console.log('\n🎉 Setup complete!');
        console.log('You can now sign in with:');
        console.log(`Email: ${adminEmail}`);
        console.log(`Password: ${adminPassword}`);
        
    } catch (error) {
        console.error('❌ Setup failed:', error.message);
        console.log('\n📝 Manual setup required:');
        console.log('1. Go to Firebase Console > Authentication');
        console.log('2. Create user with email: admin@omega.com');
        console.log('3. Go to Firestore Database');
        console.log('4. Create collection "users" with document containing:');
        console.log('   {');
        console.log('     uid: "USER_UID_FROM_AUTH",');
        console.log('     email: "admin@omega.com",');
        console.log('     role: "admin",');
        console.log('     driverName: "",');
        console.log('     createdAt: "CURRENT_TIMESTAMP",');
        console.log('     isActive: true');
        console.log('   }');
    }
}

// Run the setup
setupAdminUser().then(() => {
    process.exit(0);
}).catch((error) => {
    console.error('Setup error:', error);
    process.exit(1);
});
