import { getFirebaseAuth } from './firebase-client';
import { 
    getUserProfile, 
    createUserProfile, 
    checkAdminStatus 
} from './firestore';
import { logger } from './logger';

import type { Auth, User as FirebaseUser } from 'firebase/auth';

export interface AppUser {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
}

// Cached auth instance
let _authCache: Auth | null = null;
async function getAuth(): Promise<Auth> {
    if (!_authCache) {
        _authCache = await getFirebaseAuth();
    }
    return _authCache;
}

// Save user profile to Firestore on registration
async function saveUserProfile(user: FirebaseUser, firstName: string, lastName: string) {
    const existingProfile = await getUserProfile(user.uid);
    if (!existingProfile) {
        await createUserProfile(user.uid, {
            id: user.uid,
            email: user.email,
            firstName,
            lastName,
            role: 'user',
            createdAt: new Date().toISOString(),
        });
    }
}

export async function authSignUp(firstName: string, lastName: string, email: string, password: string): Promise<AppUser> {
    const auth = await getAuth();
    const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth');
    
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credential.user, { displayName: `${firstName} ${lastName}` });
    await saveUserProfile(credential.user, firstName, lastName);
    
    return {
        id: credential.user.uid,
        email: credential.user.email!,
        firstName,
        lastName,
        role: 'user',
    };
}

export async function authLogin(email: string, password: string): Promise<AppUser> {
    const auth = await getAuth();
    const { signInWithEmailAndPassword } = await import('firebase/auth');
    
    // Only Firebase Auth sign-in — fast, no Firestore read
    // onAuthChange will fire automatically after this and load the full profile
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const parts = (credential.user.displayName || '').split(' ');
    
    // Immediately resolve admin role from env-configured admin email (avoids flicker before Firestore check)
    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
    if (adminEmail && credential.user.email === adminEmail) {
        return {
            id: credential.user.uid,
            email: credential.user.email!,
            firstName: parts[0] || email.split('@')[0],
            lastName: parts.slice(1).join(' ') || '',
            role: 'admin',
        };
    }

    return {
        id: credential.user.uid,
        email: credential.user.email!,
        firstName: parts[0] || email.split('@')[0],
        lastName: parts.slice(1).join(' ') || '',
        role: 'user', // onAuthChange will update this with the real role from Firestore
    };
}

export async function authLoginWithGoogle(): Promise<AppUser> {
    const auth = await getAuth();
    const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
    
    const provider = new GoogleAuthProvider();
    const credential = await signInWithPopup(auth, provider);

    const nameParts = (credential.user.displayName || '').split(' ');
    const firstName = nameParts[0] || credential.user.email?.split('@')[0] || 'User';
    const lastName = nameParts.slice(1).join(' ') || '';

    await saveUserProfile(credential.user, firstName, lastName);

    const isAdminEmail = Boolean(process.env.NEXT_PUBLIC_ADMIN_EMAIL) &&
        credential.user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;

    return {
        id: credential.user.uid,
        email: credential.user.email!,
        firstName,
        lastName,
        role: isAdminEmail ? 'admin' : 'user',
    };
}

export async function authLogout() {
    const auth = await getAuth();
    const { signOut } = await import('firebase/auth');
    await signOut(auth);
}

export function onAuthChange(callback: (user: AppUser | null) => void) {
    // We need to handle the async nature carefully here
    // Start listening immediately, but auth loading is async
    let unsubscribe: (() => void) | null = null;
    let isUnsubscribed = false;
    
    // Setup the listener asynchronously
    (async () => {
        try {
            const auth = await getAuth();
            const { onAuthStateChanged } = await import('firebase/auth');
            
            // Check if already unsubscribed before setting up listener
            if (isUnsubscribed) return;
            
            unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
                if (!firebaseUser) {
                    callback(null);
                    return;
                }

                const nameParts = (firebaseUser.displayName || '').split(' ');
                const emailStr = firebaseUser.email || '';
                const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
                const isAdminEmail = Boolean(adminEmail) && emailStr === adminEmail;

                // Step 1: Resolve IMMEDIATELY with Firebase Auth data — stops the spinner now
                callback({
                    id: firebaseUser.uid,
                    email: emailStr,
                    firstName: nameParts[0] || emailStr.split('@')[0] || 'User',
                    lastName: nameParts.slice(1).join(' ') || '',
                    role: isAdminEmail ? 'admin' : 'user',
                });

                // Step 2: Silently fetch Firestore profile and update (non-blocking)
                Promise.all([
                    checkAdminStatus(firebaseUser.uid),
                    getUserProfile(firebaseUser.uid),
                ])
                    .then(([isDbAdmin, userData]) => {
                        const role = (isAdminEmail || isDbAdmin) ? 'admin' : ((userData?.role as string) || 'user');
                        callback({
                            id: firebaseUser.uid,
                            email: emailStr,
                            firstName: (userData?.firstName as string) || nameParts[0] || emailStr.split('@')[0] || 'User',
                            lastName: (userData?.lastName as string) || nameParts.slice(1).join(' ') || '',
                            role,
                        });
                    })
                    .catch((error) => {
                        // Log error but don't break auth flow - use basic user info
                        logger.error('Failed to fetch user profile from Firestore', error, 'AUTH');
                    });
            });
        } catch (error) {
            logger.error('Failed to setup auth listener', error, 'AUTH');
            callback(null);
        }
    })();

    // Return a cleanup function
    return () => {
        isUnsubscribed = true;
        if (unsubscribe) {
            unsubscribe();
        }
    };
}

export async function updateAuthProfile(uid: string, data: Partial<AppUser>) {
    const auth = await getAuth();
    const { updateProfile } = await import('firebase/auth');
    
    await import('./firestore').then(({ updateUserProfile }) => 
        updateUserProfile(uid, { ...data, updatedAt: new Date().toISOString() })
    );

    if ((data.firstName !== undefined || data.lastName !== undefined) && auth.currentUser) {
        const currentName = auth.currentUser.displayName || '';
        const currentParts = currentName.split(' ');
        const newFirst = data.firstName !== undefined ? data.firstName : currentParts[0] || '';
        const newLast = data.lastName !== undefined ? data.lastName : currentParts.slice(1).join(' ') || '';
        await updateProfile(auth.currentUser, { displayName: `${newFirst} ${newLast}`.trim() });
    }
}
