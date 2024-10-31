import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, ref, onValue, set, push, update, remove, serverTimestamp, DatabaseReference, Database } from 'firebase/database';
import { getAuth, signInAnonymously } from 'firebase/auth';
import type { User, ChatRoom, Message } from './store';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL
};

let app: ReturnType<typeof initializeApp>;
let database: Database;
let auth: ReturnType<typeof getAuth>;

export const initFirebase = () => {
  try {
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
      database = getDatabase(app);
      auth = getAuth(app);
      console.log('Firebase initialized successfully');
    }
  } catch (error) {
    console.error('Error initializing Firebase:', error);
  }
};

// Helper function to ensure database is initialized
const getDB = (): Database => {
  if (!database) {
    throw new Error('Firebase database not initialized');
  }
  return database;
};

// Anonymously authenticate users
export const signInUser = async () => {
  try {
    const { user } = await signInAnonymously(auth);
    return user.uid;
  } catch (error) {
    console.error('Error signing in:', error);
    return null;
  }
};

// Room operations
export const subscribeToRooms = (callback: (rooms: ChatRoom[]) => void) => {
  const db = getDB();
  const roomsRef = ref(db, 'rooms');
  
  return onValue(roomsRef, (snapshot) => {
    try {
      const rooms: ChatRoom[] = [];
      snapshot.forEach((childSnapshot) => {
        const messages = childSnapshot.child('messages').val() || {};
        rooms.push({
          id: childSnapshot.key!,
          ...childSnapshot.val(),
          messages: Object.entries(messages).map(([id, msg]: [string, any]) => ({
            id,
            ...msg
          }))
        });
      });
      callback(rooms);
    } catch (error) {
      console.error('Error processing rooms data:', error);
    }
  }, (error) => {
    console.error('Error subscribing to rooms:', error);
  });
};

export const createRoom = async (room: Omit<ChatRoom, 'id'>) => {
  const db = getDB();
  const roomsRef = ref(db, 'rooms');
  try {
    const newRoomRef = push(roomsRef);
    await set(newRoomRef, {
      ...room,
      createdAt: serverTimestamp(),
      messages: {}
    });
    return newRoomRef.key;
  } catch (error) {
    console.error('Error creating room:', error);
    throw error;
  }
};

export const updateRoom = async (roomId: string, updates: Partial<ChatRoom>) => {
  const db = getDB();
  const roomRef = ref(db, `rooms/${roomId}`);
  try {
    await update(roomRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating room:', error);
    throw error;
  }
};

// Message operations
export const addMessage = async (roomId: string, message: Omit<Message, 'id'>) => {
  const db = getDB();
  const messagesRef = ref(db, `rooms/${roomId}/messages`);
  try {
    const newMessageRef = push(messagesRef);
    await set(newMessageRef, {
      ...message,
      timestamp: serverTimestamp(),
      expiresAt: Date.now() + (10 * 60 * 1000) // 10 minutes
    });
    return newMessageRef.key;
  } catch (error) {
    console.error('Error adding message:', error);
    throw error;
  }
};

// Cleanup expired messages
export const cleanupExpiredMessages = async () => {
  const db = getDB();
  const roomsRef = ref(db, 'rooms');
  try {
    onValue(roomsRef, async (snapshot) => {
      const now = Date.now();
      const updates: Record<string, any> = {};
      
      snapshot.forEach((roomSnapshot) => {
        const messages = roomSnapshot.child('messages').val() || {};
        Object.entries(messages).forEach(([messageId, message]: [string, any]) => {
          if (message.expiresAt < now) {
            updates[`rooms/${roomSnapshot.key}/messages/${messageId}`] = null;
          }
        });
      });
      
      if (Object.keys(updates).length > 0) {
        const db = getDB();
        await update(ref(db), updates);
      }
    }, { onlyOnce: true });
  } catch (error) {
    console.error('Error cleaning up messages:', error);
    throw error;
  }
};

// User operations
export const updateUserPresence = async (userId: string, user: User) => {
  const db = getDB();
  const userRef = ref(db, `users/${userId}`);
  try {
    await set(userRef, {
      ...user,
      lastSeen: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating user presence:', error);
    throw error;
  }
};

export const subscribeToUsers = (callback: (users: User[]) => void) => {
  const db = getDB();
  const usersRef = ref(db, 'users');
  
  return onValue(usersRef, (snapshot) => {
    try {
      const users: User[] = [];
      snapshot.forEach((childSnapshot) => {
        users.push({
          id: childSnapshot.key!,
          ...childSnapshot.val()
        });
      });
      callback(users);
    } catch (error) {
      console.error('Error processing users data:', error);
    }
  }, (error) => {
    console.error('Error subscribing to users:', error);
  });
};