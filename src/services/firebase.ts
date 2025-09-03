import { initializeApp } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator, enableNetwork, disableNetwork } from 'firebase/firestore'
import { getStorage, connectStorageEmulator } from 'firebase/storage'
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// Initialize Firebase
export const app = initializeApp(firebaseConfig)

// Initialize services
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
export const functions = getFunctions(app)

// Enable offline persistence
try {
  // This will enable offline persistence for Firestore
  // Note: This should be called before any other Firestore operations
} catch (error) {
  console.warn('Firestore offline persistence not available:', error)
}

// Connect to emulators in development
if (import.meta.env.VITE_FIREBASE_USE_EMULATOR === 'true') {
  try {
    connectAuthEmulator(auth, import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_URL)
    connectFirestoreEmulator(db, 'localhost', 8080)
    connectStorageEmulator(storage, 'localhost', 9199)
    connectFunctionsEmulator(functions, 'localhost', 5001)
    console.log('Connected to Firebase emulators')
  } catch (error) {
    console.warn('Error connecting to emulators:', error)
  }
}

// Network status management
export const goOnline = () => enableNetwork(db)
export const goOffline = () => disableNetwork(db)

// Check if we're using emulators
export const isUsingEmulator = import.meta.env.VITE_FIREBASE_USE_EMULATOR === 'true'

export default app
