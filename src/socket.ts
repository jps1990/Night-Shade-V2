import { io } from 'socket.io-client';
import type { User, ChatRoom, Message } from './store';

// Use environment variable for the socket server URL
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

class SocketClient {
  private socket = io(SOCKET_URL, {
    withCredentials: true,
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
  });
  
  private isConnecting = false;
  private listeners = new Map<string, Set<Function>>();
  
  connect() {
    if (!this.socket.connected && !this.isConnecting) {
      this.isConnecting = true;
      console.log('Connecting to socket server...');
      
      this.socket.connect();
      
      this.socket.on('connect', () => {
        console.log('Connected to socket server');
        this.isConnecting = false;
      });
      
      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        this.isConnecting = false;
      });
      
      this.socket.on('disconnect', (reason) => {
        console.log('Disconnected from socket server:', reason);
        this.isConnecting = false;
      });
    }
  }

  // Rest of the SocketClient implementation remains the same...
}