import { create } from 'zustand';
import { nanoid } from 'nanoid';
import { generateJoke } from './utils/cohere';

// Bot class to manage response patterns
class Bot {
  private silenceCount: number = 0;
  private isFirstMessage: boolean = true;

  constructor(
    private name: string,
    private personality: 'jester' | 'grok'
  ) {}

  shouldRespond(): boolean {
    if (this.isFirstMessage) {
      this.isFirstMessage = false;
      return true;
    }
    if (this.silenceCount >= 3) {
      this.silenceCount = 0;
      return true;
    }
    const respond = Math.random() < 0.33;
    this.silenceCount = respond ? 0 : this.silenceCount + 1;
    return respond;
  }

  async generateResponse(userMessage: string): Promise<Message> {
    const response = await generateJoke(userMessage, this.personality);
    return {
      id: nanoid(),
      userId: 'bot',
      content: response,
      timestamp: Date.now(),
      isBot: true,
      botName: this.name,
      expiresAt: Date.now() + (10 * 60 * 1000),
    };
  }

  reset() {
    this.silenceCount = 0;
    this.isFirstMessage = true;
  }
}

// Initialize bot instances
const jester = new Bot('Jester', 'jester');
const grok = new Bot('Grok', 'grok');

export interface User {
  id: string;
  name: string;
  avatar: string;
}

export interface ChatRoom {
  id: string;
  name: string;
  icon: string;
  messages: Message[];
  users: User[];
  isPermanent?: boolean;
  isBot?: boolean;
}

export interface Message {
  id: string;
  userId: string;
  content: string;
  timestamp: number;
  isBot?: boolean;
  botName?: string;
  expiresAt: number;
}

interface Store {
  currentUser: User | null;
  rooms: ChatRoom[];
  currentRoom: string | null;
  showSettings: boolean;
  setCurrentUser: (user: User) => void;
  addRoom: (room: Omit<ChatRoom, 'id'>) => void;
  updateRoom: (roomId: string, updates: Partial<ChatRoom>) => void;
  deleteRoom: (roomId: string) => void;
  setCurrentRoom: (roomId: string) => void;
  toggleSettings: () => void;
  addMessage: (roomId: string, message: Omit<Message, 'id' | 'timestamp' | 'expiresAt'>) => void;
  initializeBotRooms: () => void;
  deleteExpiredMessages: () => void;
  joinRoom: (roomId: string, user: User) => void;
  leaveRoom: (roomId: string, userId: string) => void;
}

export const useStore = create<Store>((set, get) => ({
  currentUser: null,
  rooms: [],
  currentRoom: null,
  showSettings: false,

  setCurrentUser: (user) => {
    const newUser = {
      ...user,
      id: user.id || `user-${nanoid(6)}`,
    };
    set({ currentUser: newUser });
  },

  addRoom: (room) => {
    const state = get();
    const newRoom = {
      ...room,
      id: nanoid(),
      messages: [],
      users: state.currentUser ? [state.currentUser] : [],
    };
    set(state => ({
      rooms: [...state.rooms, newRoom]
    }));
  },

  updateRoom: (roomId, updates) => {
    set(state => ({
      rooms: state.rooms.map(room =>
        room.id === roomId ? { ...room, ...updates } : room
      )
    }));
  },

  deleteRoom: (roomId) => {
    set(state => ({
      rooms: state.rooms.filter(room => room.id !== roomId || room.isPermanent),
      currentRoom: state.currentRoom === roomId ? null : state.currentRoom
    }));
  },

  setCurrentRoom: (roomId) => {
    const state = get();
    // Join room if user exists
    if (state.currentUser) {
      get().joinRoom(roomId, state.currentUser);
    }
    // Reset bot responders
    jester.reset();
    grok.reset();
    set({ currentRoom: roomId });
  },

  toggleSettings: () => {
    set(state => ({ showSettings: !state.showSettings }));
  },

  joinRoom: (roomId, user) => {
    set(state => ({
      rooms: state.rooms.map(room => {
        if (room.id !== roomId) return room;
        if (room.users.some(u => u.id === user.id)) return room;
        return {
          ...room,
          users: [...room.users, user],
        };
      }),
    }));
  },

  leaveRoom: (roomId, userId) => {
    set(state => ({
      rooms: state.rooms.map(room => {
        if (room.id !== roomId) return room;
        return {
          ...room,
          users: room.users.filter(u => u.id !== userId),
        };
      }),
    }));
  },

  addMessage: async (roomId, message) => {
    const state = get();
    const room = state.rooms.find(r => r.id === roomId);
    if (!room) return;

    const newMessage = {
      ...message,
      id: nanoid(),
      timestamp: Date.now(),
      expiresAt: room.id === 'suggestions' 
        ? Number.MAX_SAFE_INTEGER 
        : Date.now() + (10 * 60 * 1000),
    };

    set(state => ({
      rooms: state.rooms.map(r => {
        if (r.id !== roomId) return r;
        return {
          ...r,
          messages: [...r.messages, newMessage],
        };
      }),
    }));

    // Bot response logic - only respond to non-bot messages
    if (!message.isBot) {
      // Handle dedicated bot rooms
      if (room.isBot) {
        const bot = room.id === 'jester-asylum' ? jester : grok;
        const botMessage = await bot.generateResponse(message.content);
        
        set(state => ({
          rooms: state.rooms.map(r => {
            if (r.id !== roomId) return r;
            return {
              ...r,
              messages: [...r.messages, botMessage],
            };
          }),
        }));
      } 
      // Handle user-created rooms with both bots
      else if (!room.isPermanent) {
        const bots = [jester, grok];
        for (const bot of bots) {
          if (bot.shouldRespond()) {
            const botMessage = await bot.generateResponse(message.content);
            set(state => ({
              rooms: state.rooms.map(r => {
                if (r.id !== roomId) return r;
                return {
                  ...r,
                  messages: [...r.messages, botMessage],
                };
              }),
            }));
            break; // Only one bot responds at a time
          }
        }
      }
    }
  },

  initializeBotRooms: () => {
    const state = get();
    if (!state.rooms.some(r => r.id === 'jester-asylum')) {
      set(state => ({
        rooms: [
          ...state.rooms,
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
        ]
      }));
    }
  },

  deleteExpiredMessages: () => {
    const now = Date.now();
    set(state => ({
      rooms: state.rooms.map(room => ({
        ...room,
        messages: room.messages.filter(msg => msg.expiresAt > now)
      }))
    }));
  }
}));