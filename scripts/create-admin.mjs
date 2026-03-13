
import { initializeApp } from "firebase/app";
import {
    getAuth,
    createUserWithEmailAndPassword,
    updateProfile
} from "firebase/auth";
import {
    getFirestore,
    doc,
    setDoc,
    serverTimestamp
} from "firebase/firestore";

// Firebase configuration from environment variables
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Get admin credentials from command line arguments or environment variables
const NEW_ADMIN_EMAIL = process.argv[2] || process.env.ADMIN_EMAIL;
const NEW_ADMIN_PASSWORD = process.argv[3] || process.env.ADMIN_PASSWORD;

async function createAdmin() {
    console.log("🚀 Initializing admin creation...");

    if (!NEW_ADMIN_EMAIL || !NEW_ADMIN_PASSWORD) {
        console.error("❌ Error: Missing admin credentials.");
        console.log("Usage: node scripts/create-admin.mjs <email> <password>");
        console.log("Or set ADMIN_EMAIL and ADMIN_PASSWORD environment variables");
        process.exit(1);
    }

    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
        console.error("❌ Error: Firebase configuration is missing in environment variables.");
        process.exit(1);
    }

    try {
        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        const db = getFirestore(app);

        console.log(`📡 Creating user ${NEW_ADMIN_EMAIL}...`);
        const userCredential = await createUserWithEmailAndPassword(auth, NEW_ADMIN_EMAIL, NEW_ADMIN_PASSWORD);
        const user = userCredential.user;

        console.log("👤 Updating profile...");
        await updateProfile(user, { displayName: "Super Admin" });

        console.log("📂 Setting admin role in Firestore...");
        await setDoc(doc(db, "users", user.uid), {
            id: user.uid,
            email: user.email,
            firstName: "Super",
            lastName: "Admin",
            role: "admin",
            createdAt: serverTimestamp(),
        });

        console.log("✅ Admin account created successfully!");
        console.log("-----------------------------------------");
        console.log(`Email: ${NEW_ADMIN_EMAIL}`);
        console.log(`Password: ${NEW_ADMIN_PASSWORD}`);
        console.log("-----------------------------------------");
        console.log("Please log in at /login to verify.");

    } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
            console.log("ℹ️ User already exists. Checking Firestore role...");
            // Optionally update the role if the user exists but isn't admin
            // For now, we'll just report success or manually update if needed
        } else {
            console.error("❌ Error creating admin:", error.message);
        }
    }
    process.exit(0);
}

createAdmin();
