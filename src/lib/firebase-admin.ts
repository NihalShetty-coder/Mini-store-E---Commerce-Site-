import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let adminApp: App;
let adminDb: Firestore;

function getAdminApp(): App {
    if (adminApp) return adminApp;

    if (getApps().length > 0) {
        adminApp = getApps()[0];
        return adminApp;
    }

    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (clientEmail && privateKey && projectId) {
        // Use service account credentials when available
        adminApp = initializeApp({
            credential: cert({ projectId, clientEmail, privateKey }),
        });
    } else if (projectId) {
        // Fall back to Application Default Credentials (works on Google Cloud / emulator)
        adminApp = initializeApp({ projectId });
    } else {
        throw new Error(
            'Firebase Admin: set FIREBASE_ADMIN_PROJECT_ID (or NEXT_PUBLIC_FIREBASE_PROJECT_ID) ' +
            'plus FIREBASE_ADMIN_CLIENT_EMAIL and FIREBASE_ADMIN_PRIVATE_KEY.'
        );
    }

    return adminApp;
}

export function getAdminFirestore(): Firestore {
    if (adminDb) return adminDb;
    adminDb = getFirestore(getAdminApp());
    return adminDb;
}
