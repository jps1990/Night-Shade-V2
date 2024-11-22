import { create } from 'zustand';
import { nanoid } from 'nanoid';
import { User, ChatRoom, Message } from './types';
import { initFirebase, getDB, subscribeToRooms, subscribeToUsers } from './utils/firebase';
import { ref, set, update, get } from 'firebase/database';

interface StoreState {
  currentUser: User | null;
  currentRoom: string | null;
  rooms: ChatRoom[];
  showSettings: boolean;
  initialized: boolean;
}

interface StoreActions {
  setCurrentUser: (user: User | null) => void;
  setCurrentRoom: (roomId: string | null) => void;
  toggleSettings: () => void;
  addRoom: (room: Omit<ChatRoom, 'id'>) => Promise<void>;
  updateRoom: (roomId: string, updates: Partial<ChatRoom>) => Promise<void>;
  addMessage: (roomId: string, message: Partial<Message>) => Promise<void>;
  deleteRoom: (roomId: string) => Promise<void>;
  initializeBotRooms: () => Promise<void>;
  setInitialized: (value: boolean) => void;
  setRooms: (rooms: ChatRoom[]) => void;
}

export const useStore = create<StoreState & StoreActions>((set, get) => {
  // Initialize Firebase immediately
  initFirebase().catch(console.error);

  return {
    // State initial
    currentUser: null,
    currentRoom: null,
    rooms: [],
    showSettings: false,
    initialized: false,

    // Actions
    setCurrentUser: (user) => set({ currentUser: user }),
    setCurrentRoom: (roomId) => set({ currentRoom: roomId }),
    toggleSettings: () => set((state) => ({ showSettings: !state.showSettings })),
    setInitialized: (value) => set({ initialized: value }),
    setRooms: (rooms) => set({ rooms }),

    deleteRoom: async (roomId) => {
      const db = await getDB();
      if (!db) return;
      const roomRef = ref(db, `rooms/${roomId}`);
      await set(roomRef, null);
    },

    addRoom: async (room) => {
      const db = await getDB();
      if (!db) return;
      const roomId = nanoid();
      const roomRef = ref(db, `rooms/${roomId}`);
      await set(roomRef, { ...room, id: roomId });
      set({ currentRoom: roomId });
    },

    updateRoom: async (roomId, updates) => {
      const db = await getDB();
      if (!db) return;

      const roomRef = ref(db, `rooms/${roomId}`);
      await update(roomRef, updates);
    },

    addMessage: async (roomId, message) => {
      const db = await getDB();
      if (!db) return;

      const messageId = nanoid();
      const messagesRef = ref(db, `rooms/${roomId}/messages/${messageId}`);
      const fullMessage: Message = {
        id: messageId,
        userId: message.userId || 'system',
        content: message.content || '',
        timestamp: Date.now(),
        expiresAt: Date.now() + (10 * 60 * 1000),
        isBot: message.isBot || false,
        botName: message.botName,
        context: message.context
      };

      await set(messagesRef, fullMessage);
    },

    initializeBotRooms: async () => {
      const db = await getDB();
      if (!db) return;

      const defaultRooms = [
        {
          id: 'jester-asylum',
          name: "Jester's Asylum",
          icon: '🃏',
          messages: [],
          users: [],
          isPermanent: true,
          isBot: true
        },
        {
          id: 'grok-domain',
          name: "Grok's Domain",
          icon: '⚔️',
          messages: [],
          users: [],
          isPermanent: true,
          isBot: true
        },
        {
          id: 'suggestions',
          name: "Suggestions & Feedback",
          icon: '💭',
          messages: [],
          users: [],
          isPermanent: true,
          isBot: false
        }
      ];

      try {
        for (const room of defaultRooms) {
          const roomRef = ref(db, `rooms/${room.id}`);
          const snapshot = await get(roomRef);
          
          if (!snapshot.exists()) {
            await set(roomRef, room);
          }
        }
        set({ initialized: true });
      } catch (error) {
        console.error('Failed to initialize bot rooms:', error);
      }
    }
  };
});