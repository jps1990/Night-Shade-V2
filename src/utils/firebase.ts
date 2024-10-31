import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getDatabase, ref as dbRef, onValue, set, push, update } from 'firebase/database';
import type { User, ChatRoom, Message } from '../store';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL
};

let app: ReturnType<typeof initializeApp> | null = null;
let storage: ReturnType<typeof getStorage> | null = null;
let database: ReturnType<typeof getDatabase> | null = null;

export function initFirebase() {
  if (!import.meta.env.VITE_FIREBASE_API_KEY) {
    console.warn('Firebase configuration missing');
    return false;
  }

  try {
    app = initializeApp(firebaseConfig);
    storage = getStorage(app);
    database = getDatabase(app);
    return true;
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
    return false;
  }
}

export async function uploadImage(file: File): Promise<string> {
  if (!storage) {
    throw new Error('Firebase Storage not initialized');
  }
  
  try {
    const storageRef = ref(storage, `images/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
}

export function subscribeToRooms(callback: (rooms: ChatRoom[]) => void) {
  if (!database) return () => {};
  
  const roomsRef = dbRef(database, 'rooms');
  const unsubscribe = onValue(roomsRef, (snapshot) => {
    const rooms: ChatRoom[] = [];
    snapshot.forEach((childSnapshot) => {
      rooms.push({ id: childSnapshot.key, ...childSnapshot.val() });
    });
    callback(rooms);
  });
  
  return unsubscribe;
}

export function subscribeToUsers(callback: (users: User[]) => void) {
  if (!database) return () => {};
  
  const usersRef = dbRef(database, 'users');
  const unsubscribe = onValue(usersRef, (snapshot) => {
    const users: User[] = [];
    snapshot.forEach((childSnapshot) => {
      users.push({ id: childSnapshot.key, ...childSnapshot.val() });
    });
    callback(users);
  });
  
  return unsubscribe;
}

export async function addUser(user: User) {
  if (!database) return;
  
  const userRef = dbRef(database, `users/${user.id}`);
  await set(userRef, user);
}

export async function addRoom(room: Omit<ChatRoom, 'id'>) {
  if (!database) return;
  
  const roomsRef = dbRef(database, 'rooms');
  const newRoomRef = push(roomsRef);
  await set(newRoomRef, room);
  return newRoomRef.key;
}

export async function updateRoom(roomId: string, updates: Partial<ChatRoom>) {
  if (!database) return;
  
  const roomRef = dbRef(database, `rooms/${roomId}`);
  await update(roomRef, updates);
}

export async function addMessage(roomId: string, message: Message) {
  if (!database) return;
  
  const messagesRef = dbRef(database, `rooms/${roomId}/messages`);
  const newMessageRef = push(messagesRef);
  await set(newMessageRef, message);
}

export async function deleteExpiredMessages(roomId: string) {
  if (!database) return;
  
  const messagesRef = dbRef(database, `rooms/${roomId}/messages`);
  const now = Date.now();
  
  onValue(messagesRef, (snapshot) => {
    const updates: Record<string, null> = {};
    snapshot.forEach((childSnapshot) => {
      const message = childSnapshot.val();
      if (message.expiresAt < now) {
        updates[childSnapshot.key!] = null;
      }
    });
    
    if (Object.keys(updates).length > 0) {
      update(messagesRef, updates);
    }
  }, { onlyOnce: true });
}