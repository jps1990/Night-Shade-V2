import { io, Socket } from 'socket.io-client';
import type { User, ChatRoom, Message } from './types';

// Use environment variable for the socket server URL
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

type SocketCallback = (...args: any[]) => void;

class SocketClient {
  private socket: Socket = io(SOCKET_URL, {
    withCredentials: true,
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
  });
  
  private isConnecting = false;
  private listeners = new Map<string, Set<SocketCallback>>();

  private addListener(event: string, callback: SocketCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);
    this.socket.on(event, callback);
  }

  private removeListener(event: string, callback: SocketCallback) {
    this.listeners.get(event)?.delete(callback);
    this.socket.off(event, callback);
  }
  
  connect() {
    if (!this.socket.connected && !this.isConnecting) {
      this.isConnecting = true;
      console.log('Connecting to socket server...');
      
      this.socket.connect();
      
      this.addListener('connect', () => {
        console.log('Connected to socket server');
        this.isConnecting = false;
      });
      
      this.addListener('connect_error', (error: Error) => {
        console.error('Socket connection error:', error);
        this.isConnecting = false;
      });
      
      this.addListener('disconnect', (reason: Socket.DisconnectReason) => {
        console.log('Disconnected from socket server:', reason);
        this.isConnecting = false;
      });
    }
  }

  disconnect() {
    // Clean up all listeners before disconnecting
    this.listeners.forEach((callbacks, event) => {
      callbacks.forEach(callback => {
        this.socket.off(event, callback);
      });
    });
    this.listeners.clear();
    this.socket.disconnect();
  }

  // User events
  onUserJoined(callback: (user: User) => void) {
    this.addListener('user:joined', callback);
    return () => this.removeListener('user:joined', callback);
  }

  onUserLeft(callback: (user: User) => void) {
    this.addListener('user:left', callback);
    return () => this.removeListener('user:left', callback);
  }

  // Room events
  onRoomCreated(callback: (room: ChatRoom) => void) {
    this.addListener('room:created', callback);
    return () => this.removeListener('room:created', callback);
  }

  onRoomUpdated(callback: (room: ChatRoom) => void) {
    this.addListener('room:updated', callback);
    return () => this.removeListener('room:updated', callback);
  }

  onRoomDeleted(callback: (roomId: string) => void) {
    this.addListener('room:deleted', callback);
    return () => this.removeListener('room:deleted', callback);
  }

  // Message events
  onMessageReceived(callback: (message: Message) => void) {
    this.addListener('message:received', callback);
    return () => this.removeListener('message:received', callback);
  }

  // Emit events
  joinRoom(roomId: string, user: User) {
    this.socket.emit('room:join', { roomId, user });
  }

  leaveRoom(roomId: string, user: User) {
    this.socket.emit('room:leave', { roomId, user });
  }

  sendMessage(roomId: string, message: Message) {
    this.socket.emit('message:send', { roomId, message });
  }
}

// Export singleton instance
export const socketClient = new SocketClient();