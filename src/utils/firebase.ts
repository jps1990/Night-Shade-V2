import { initializeApp } from 'firebase/app';
import { 
  getDatabase, 
  ref, 
  onValue, 
  get as dbGet 
} from 'firebase/database';
import type { User, ChatRoom } from '../types';

let app: ReturnType<typeof initializeApp> | null = null;
let database: ReturnType<typeof getDatabase> | null = null;

export async function initFirebase(): Promise<boolean> {
  if (app && database) {
    return true;
  }

  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL
  };

  // Check if all required config values are present
  const missingConfig = Object.entries(firebaseConfig).filter(([_, value]) => !value);
  if (missingConfig.length > 0) {
    console.warn('Missing Firebase config:', missingConfig.map(([key]) => key).join(', '));
    return false;
  }

  try {
    app = initializeApp(firebaseConfig);
    database = getDatabase(app);
    return true;
  } catch (error) {
    console.error('Firebase initialization error:', error);
    return false;
  }
}

export async function getDB() {
  if (!database) {
    const isInitialized = await initFirebase();
    if (!isInitialized) {
      console.error('Failed to initialize Firebase');
      return null;
    }
  }
  return database;
}

export function subscribeToRooms(callback: (rooms: ChatRoom[]) => void) {
  if (!database) return () => {};
  
  const roomsRef = ref(database, 'rooms');
  return onValue(roomsRef, (snapshot) => {
    const rooms: ChatRoom[] = [];
    snapshot.forEach((childSnapshot) => {
      if (childSnapshot.key && childSnapshot.val()) {
        rooms.push({ id: childSnapshot.key, ...childSnapshot.val() });
      }
    });
    callback(rooms);
  });
}

export function subscribeToUsers(callback: (users: User[]) => void) {
  if (!database) return () => {};
  
  const usersRef = ref(database, 'users');
  return onValue(usersRef, (snapshot) => {
    const users: User[] = [];
    snapshot.forEach((childSnapshot) => {
      if (childSnapshot.key && childSnapshot.val()) {
        users.push({ id: childSnapshot.key, ...childSnapshot.val() });
      }
    });
    callback(users);
  });
}

export async function getRoom(roomId: string) {
  if (!database) return null;
  const roomRef = ref(database, `rooms/${roomId}`);
  const snapshot = await dbGet(roomRef);
  return snapshot.val();
}