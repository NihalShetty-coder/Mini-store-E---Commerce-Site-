/**
 * Firebase Compatibility Layer
 * 
 * This file maintains backward compatibility for any code that imports from './firebase'.
 * All Firebase services are now lazy-loaded from './firebase-client' for better HMR performance.
 * 
 * DEPRECATED: New code should import from './firebase-client' directly for lazy-loaded instances.
 */

import { getFirebaseApp, getFirebaseAuth, getFirebaseDb, getFirebaseStorage, getFirebaseAnalytics } from './firebase-client';

// Re-export lazy getters
export { getFirebaseApp, getFirebaseAuth, getFirebaseDb, getFirebaseStorage };

// Legacy compatibility: Export async getter for analytics
export { getFirebaseAnalytics };

// For backward compatibility, we export a promise-based getter
// Components that need sync access should migrate to the async pattern
export const getFirebaseServices = async () => {
    const [app, auth, db, storage] = await Promise.all([
        getFirebaseApp(),
        getFirebaseAuth(),
        getFirebaseDb(),
        getFirebaseStorage(),
    ]);
    return { app, auth, db, storage };
};
