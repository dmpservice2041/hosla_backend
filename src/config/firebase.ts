import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';

const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');

let isFirebaseInitialized = false;

try {
    if (fs.existsSync(serviceAccountPath)) {
        const serviceAccount = require(serviceAccountPath);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
        isFirebaseInitialized = true;
        console.log('Firebase Admin initialized successfully.');
    } else {
        console.warn(
            'WARNING: Firebase serviceAccountKey.json not found in src/config/. FCM features will not work.'
        );
    }
} catch (error) {
    console.error('Error initializing Firebase Admin:', error);
}

export const firebaseAdmin = isFirebaseInitialized ? admin : null;
export { isFirebaseInitialized };
