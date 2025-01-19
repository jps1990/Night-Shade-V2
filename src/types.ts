export interface User {
  id: string;
  name: string;
  avatar?: string;
}

export interface Message {
  id: string;
  userId: string;
  content: string;
  timestamp: number;
  expiresAt: number;
  isBot?: boolean;
  botName?: string;
  context?: string;
  streamResponse?: string;
}

export interface ChatRoom {
  id: string;
  name: string;
  icon: string;
  messages: Message[];
  users: User[];
  isPermanent: boolean;
  isBot?: boolean;
}

export interface Bot {
  generateResponse: (
    message: string, 
    context?: string,
    onStream?: (text: string) => void
  ) => Promise<Message>;
  reset: () => void;
}

export interface StoreState {
  currentUser: User | null;
  currentRoom: string | null;
  rooms: ChatRoom[];
  showSettings: boolean;
} 