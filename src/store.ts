import { create } from 'zustand';
import { nanoid } from 'nanoid';
import { User, ChatRoom, Message } from './types';
import { addMessageToFirebase, getDB, updateRoom } from './firebase';
import { jester, grok } from './utils/bots.ts';
import { ref, set } from 'firebase/database';

interface StoreState {
  currentUser: User | null;
  currentRoom: string | null;
  rooms: ChatRoom[];
  showSettings: boolean;
}

interface StoreActions {
  setCurrentUser: (user: User | null) => void;
  setCurrentRoom: (roomId: string | null) => void;
  toggleSettings: () => void;
  joinRoom: (roomId: string, user: User) => Promise<void>;
  leaveRoom: (roomId: string, userId: string) => Promise<void>;
  addMessage: (roomId: string, message: Partial<Message>) => Promise<void>;
  deleteRoom: (roomId: string) => Promise<void>;
  initializeBotRooms: () => Promise<void>;
}

export const useStore = create<StoreState & StoreActions>((set, get) => {
  const store = {
    currentUser: null,
    currentRoom: null,
    rooms: [],
    showSettings: false,

    toggleSettings: () => {
      set(state => ({ showSettings: !state.showSettings }));
    },

    initializeBotRooms: async () => {
      const state = get();
      const currentRooms = state.rooms || [];
      
      if (!currentRooms.some(r => r.id === 'jester-asylum')) {
        const defaultRooms: ChatRoom[] = [
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
            name: "Suggestions & Ideas",
            icon: '💡',
            messages: [],
            users: [],
            isPermanent: true
          }
        ];

        const db = getDB();
        if (!db) return;

        try {
          for (const room of defaultRooms) {
            const roomRef = ref(db, `rooms/${room.id}`);
            await set(roomRef, room);
          }

          set(state => ({
            ...state,
            rooms: [...currentRooms, ...defaultRooms]
          }));
        } catch (error) {
          console.error('Error initializing bot rooms:', error);
        }
      }
    }
    // ... autres méthodes
  };
  
  return store;
});