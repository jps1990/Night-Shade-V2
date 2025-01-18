import { create } from 'zustand';
import { nanoid } from 'nanoid';
import { User, ChatRoom, Message } from './types';
import { initFirebase } from './utils/firebase';
import { 
  getDatabase, 
  ref, 
  set as firebaseSet, 
  update as firebaseUpdate, 
  get as firebaseGet,
  onValue,
  DatabaseReference 
} from 'firebase/database';

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
  const database = getDatabase();

  const addMessageToRoom = async (roomId: string, message: Partial<Message>) => {
    if (!database) return;
    const messageId = nanoid();
    const messagesRef = ref(database, `rooms/${roomId}/messages/${messageId}`);
    const fullMessage: Message = {
      id: messageId,
      userId: message.userId || 'system',
      content: message.content || '',
      timestamp: Date.now(),
      expiresAt: Date.now() + (10 * 60 * 1000),
      isBot: message.isBot || false,
      ...(message.botName ? { botName: message.botName } : {}),
      ...(message.context ? { context: message.context } : {})
    };

    await firebaseSet(messagesRef, fullMessage);
    return fullMessage;
  };

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

    addMessage: async (roomId: string, message: Partial<Message>) => {
      await addMessageToRoom(roomId, message);
    },

    deleteRoom: async (roomId) => {
      if (!database) return;
      const roomRef = ref(database, `rooms/${roomId}`);
      await firebaseSet(roomRef, null);
    },

    addRoom: async (room) => {
      if (!database) return;
      const roomId = nanoid();
      const roomRef = ref(database, `rooms/${roomId}`);
      await firebaseSet(roomRef, { ...room, id: roomId });
      set({ currentRoom: roomId });
    },

    updateRoom: async (roomId, updates) => {
      if (!database) return;
      const roomRef = ref(database, `rooms/${roomId}`);
      await firebaseUpdate(roomRef, updates);
    },

    initializeBotRooms: async () => {
      if (!database) return;

      const defaultRooms = [
        {
          id: 'jester-asylum',
          name: "Jester's Asylum",
          icon: '🃏',
          messages: [],
          users: [],
          isPermanent: true,
          isBot: true,
          description: "Le repaire du bouffon gothique"
        },
        {
          id: 'grok-domain',
          name: "Grok's Domain",
          icon: '⚔️',
          messages: [],
          users: [],
          isPermanent: true,
          isBot: true,
          description: "L'antre du mentor brutal"
        },
        {
          id: 'suggestions',
          name: "Suggestions & Feedback",
          icon: '💭',
          messages: [],
          users: [],
          isPermanent: true,
          isBot: false,
          description: "Partagez vos idées et suggestions"
        }
      ];

      try {
        for (const room of defaultRooms) {
          const roomRef = ref(database, `rooms/${room.id}`);
          const snapshot = await firebaseGet(roomRef);
          
          if (!snapshot.exists()) {
            await firebaseSet(roomRef, room);
          }
        }
        set({ initialized: true });
      } catch (error) {
        console.error('Failed to initialize bot rooms:', error);
      }
    }
  };
});