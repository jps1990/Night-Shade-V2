import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Edit, Users } from 'lucide-react';
import { useStore } from '../store';
import { BotMessage } from './BotMessage';
import { MessageInput } from './MessageInput';
import { MessageList } from './MessageList';
import { RoomCustomization } from './RoomCustomization';

const ChatRoom: React.FC = () => {
  const { currentRoom, currentUser, addMessage, rooms, deleteExpiredMessages } = useStore();
  const [message, setMessage] = useState('');
  const [showCustomization, setShowCustomization] = useState(false);
  const [isGeneratingJoke, setIsGeneratingJoke] = useState(false);
  const [streamedResponse, setStreamedResponse] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();
  
  const room = rooms.find(r => r.id === currentRoom);

  const scrollToBottom = useCallback((smooth = true) => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: smooth ? 'smooth' : 'auto',
        block: 'end'
      });
    }, 100);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [room?.messages, scrollToBottom, streamedResponse]);

  useEffect(() => {
    if (isGeneratingJoke) {
      scrollToBottom();
    }
  }, [isGeneratingJoke, scrollToBottom]);

  useEffect(() => {
    messageInputRef.current?.focus();
    scrollToBottom(false);
  }, [currentRoom, scrollToBottom]);

  useEffect(() => {
    const cleanup = setInterval(() => {
      deleteExpiredMessages();
    }, 60000);
    
    return () => {
      clearInterval(cleanup);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [deleteExpiredMessages]);

  const handleSend = useCallback(async () => {
    if (!message.trim() || !currentRoom || !currentUser) return;

    const currentMessage = message.trim();
    setMessage('');

    try {
      await addMessage(currentRoom, {
        userId: currentUser.id,
        content: currentMessage,
      });
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
      setMessage(currentMessage);
    }
  }, [message, currentRoom, currentUser, addMessage, scrollToBottom]);

  if (!room) return null;

  const activeUsers = room.users.filter(user => user.id !== 'bot');

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 p-4 border-b border-purple-500/20">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{room.icon}</span>
          <h2 className="text-xl font-bold">{room.name}</h2>
          {!room.isPermanent && (
            <button 
              onClick={() => setShowCustomization(true)} 
              className="p-2 rounded-full hover:bg-purple-500/20"
            >
              <Edit className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="px-4 py-2 rounded-lg bg-blue-500/20">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>{activeUsers.length} Users</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <MessageList messages={room.messages} currentUser={currentUser} />
        
        {isGeneratingJoke && streamedResponse && (
          <div className="flex justify-start px-4 pb-4">
            <div className="max-w-[70%] p-3 rounded-lg bg-blue-500/20 text-blue-100">
              <div className="break-words">{streamedResponse}</div>
            </div>
          </div>
        )}
        
        <BotMessage isGenerating={isGeneratingJoke && !streamedResponse} />
        
        <div ref={messagesEndRef} className="h-4" />
      </div>

      <MessageInput
        ref={messageInputRef}
        message={message}
        setMessage={setMessage}
        onSend={handleSend}
      />

      {showCustomization && (
        <RoomCustomization
          room={room}
          onClose={() => setShowCustomization(false)}
        />
      )}
    </div>
  );
};

export default ChatRoom;