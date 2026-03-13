/**
 * Cleanup Script - Remove All Test/Fake Data
 * 
 * This script removes all data from:
 * - products
 * - orders
 * - analytics_events
 * 
 * Usage: npm run cleanup:all
 * 
 * WARNING: This will delete ALL data in these collections!
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, deleteDoc } = require('firebase/firestore');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
require('dotenv').config({ path: '.env.local' });

// Firebase configuration from environment variables
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function cleanupCollection(collectionName) {
    console.log(`🧹 Cleaning ${collectionName}...`);
    const snapshot = await getDocs(collection(db, collectionName));
    
    if (snapshot.size === 0) {
        console.log(`  ℹ️  No documents found in ${collectionName}`);
        return 0;
    }
    
    let deleted = 0;
    for (const docSnap of snapshot.docs) {
        await deleteDoc(docSnap.ref);
        deleted++;
        if (deleted % 10 === 0) {
            console.log(`  Progress: ${deleted}/${snapshot.size} deleted...`);
        }
    }
    
    console.log(`  ✅ Deleted ${deleted} documents from ${collectionName}`);
    return deleted;
}

async function main() {
    console.log('🗑️  Starting cleanup of all test/fake data...\n');
    console.log('⚠️  WARNING: This will delete ALL data from products, orders, and analytics_events!\n');
    
    try {
        // Sign in with admin credentials
        const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'nihalnshetty42@gmail.com';
        const adminPassword = process.env.ADMIN_PASSWORD;
        
        if (!adminPassword) {
            console.log('❌ ADMIN_PASSWORD not set in .env.local');
            console.log('Please add: ADMIN_PASSWORD=your_password');
            process.exit(1);
        }
        
        console.log(`🔐 Signing in as ${adminEmail}...`);
        await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
        console.log('✅ Authenticated\n');
        
        // Clean all collections
        const collections = ['products', 'orders', 'analytics_events'];
        let totalDeleted = 0;
        
        for (const collectionName of collections) {
            const deleted = await cleanupCollection(collectionName);
            totalDeleted += deleted;
        }
        
        console.log('\n🎉 Cleanup completed successfully!');
        console.log(`📊 Total documents deleted: ${totalDeleted}`);
        console.log('\n✨ Your database is now clean!');
        console.log('\n📊 Next steps:');
        console.log('  1. Refresh your analytics dashboard at /admin/analytics');
        console.log('  2. You should see $0 everywhere (no data)');
        console.log('  3. Add real products through /admin/products/create');
        console.log('  4. Start taking real orders to build genuine analytics');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Cleanup failed:', error.message);
        process.exit(1);
    }
}

main();
