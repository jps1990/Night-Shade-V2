import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, push, update, onValue, get } from 'firebase/database';
import { User, ChatRoom, Message } from './types.ts';
import { nanoid } from 'nanoid';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL
};

let app = initializeApp(firebaseConfig);
let database = getDatabase(app);

export const getDB = () => database;

export async function addUser(user: User) {
  if (!database) return;
  const userRef = ref(database, `users/${user.id}`);
  await set(userRef, user);
}

export async function addRoom(room: Omit<ChatRoom, 'id'>) {
  if (!database) return;
  const roomsRef = ref(database, 'rooms');
  const newRoomRef = push(roomsRef);
  await set(newRoomRef, room);
  return newRoomRef.key;
}

export async function updateRoom(roomId: string, updates: Partial<ChatRoom>) {
  if (!database) return;
  const roomRef = ref(database, `rooms/${roomId}`);
  await update(roomRef, updates);
}

export async function addMessage(roomId: string, message: Message) {
  if (!database) return;
  const messagesRef = ref(database, `rooms/${roomId}/messages`);
  const newMessageRef = push(messagesRef);
  await set(newMessageRef, message);
}

export const cleanupExpiredMessages = () => {
  if (!database) return;
  const roomsRef = ref(database, 'rooms');
  
  return onValue(roomsRef, async (snapshot) => {
    const now = Date.now();
    const updates: Record<string, any> = {};
    
    snapshot.forEach((roomSnapshot) => {
      if (roomSnapshot.key === 'suggestions') return;
      
      const messages = roomSnapshot.child('messages').val() || {};
      Object.entries(messages).forEach(([messageId, message]: [string, any]) => {
        if (message.expiresAt < now) {
          updates[`rooms/${roomSnapshot.key}/messages/${messageId}`] = null;
        }
      });
    });
    
    if (Object.keys(updates).length > 0) {
      await update(ref(database), updates);
    }
  });
};

export async function getRooms() {
  if (!database) return [];
  const roomsRef = ref(database, 'rooms');
  const snapshot = await get(roomsRef);
  return Object.entries(snapshot.val() || {}).map(([id, room]: [string, any]) => ({
    id,
    ...room
  }));
}

export async function getRoom(roomId: string) {
  if (!database) return null;
  const roomRef = ref(database, `rooms/${roomId}`);
  const snapshot = await get(roomRef);
  return snapshot.val();
}

export async function addMessageToFirebase(roomId: string, message: Partial<Message>) {
  if (!database) return;
  
  const messagesRef = ref(database, `rooms/${roomId}/messages`);
  const newMessageRef = push(messagesRef);
  const fullMessage: Message = {
    id: message.id || nanoid(),
    userId: message.userId || 'system',
    content: message.content || '',
    timestamp: Date.now(),
    expiresAt: message.expiresAt || Date.now() + (10 * 60 * 1000),
    isBot: message.isBot || false,
    botName: message.botName || undefined,
    context: message.context || undefined
  };
  
  await set(newMessageRef, fullMessage);
}