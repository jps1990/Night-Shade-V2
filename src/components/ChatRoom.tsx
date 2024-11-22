import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Edit, Users } from 'lucide-react';
import { useStore } from '../store';
import { MessageInput } from './MessageInput';
import { MessageList } from './MessageList';
import { RoomCustomization } from './RoomCustomization';
import { getDatabase as getDB, ref, onValue } from 'firebase/database';
import { User, Message, ChatRoom as ChatRoomType } from '../types';

interface ChatRoomProps {
  currentRoom: string | null;
  currentUser: User | null;
}

const ChatRoom: React.FC<ChatRoomProps> = ({ currentRoom, currentUser }) => {
  const { addMessage } = useStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState('');
  const [showCustomization, setShowCustomization] = useState(false);
  const [isGeneratingJoke, setIsGeneratingJoke] = useState(false);
  const [streamedResponse, setStreamedResponse] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (!currentRoom) return;

    const db = getDB();
    const messagesRef = ref(db, `rooms/${currentRoom}/messages`);
    
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const messagesData = snapshot.val();
      if (!messagesData) {
        setMessages([]);
        return;
      }

      const messageArray = Object.entries(messagesData)
        .map(([id, msg]: [string, any]) => ({
          ...msg,
          id,
        }))
        .sort((a, b) => a.timestamp - b.timestamp);

      setMessages(messageArray);
      scrollToBottom();
    });

    return () => unsubscribe();
  }, [currentRoom, scrollToBottom]);

  const handleSend = async () => {
    if (!message.trim() || !currentRoom || !currentUser) return;

    setIsGeneratingJoke(true);
    try {
      await addMessage(currentRoom, {
        content: message,
        userId: currentUser.id,
        isBot: false
      });
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsGeneratingJoke(false);
    }
  };

  useEffect(() => {
    if (streamedResponse) {
      setStreamedResponse('');
    }
  }, [streamedResponse]);

  if (!currentRoom || !currentUser) {
    return <div className="flex-1 bg-gray-900 p-4">Sélectionne une room pour commencer...</div>;
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-900">
      <div className="flex justify-between items-center p-4 border-b border-gray-800">
        <h2 className="text-xl font-bold">{currentRoom}</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCustomization(true)}
            className="p-2 hover:bg-gray-800 rounded-full"
          >
            <Edit className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-gray-800 rounded-full">
            <Users className="w-5 h-5" />
          </button>
        </div>
      </div>

      <MessageList 
        messages={messages} 
        currentUser={currentUser} 
        messagesEndRef={messagesEndRef}
      />
      
      <MessageInput
        message={message}
        setMessage={setMessage}
        onSend={handleSend}
        isGeneratingJoke={isGeneratingJoke}
        streamedResponse={streamedResponse}
      />

      {showCustomization && (
        <RoomCustomization
          room={
            {
              id: currentRoom || '',
              name: currentRoom || '',
              icon: '🌙',
              messages: messages,
              users: [],
              isPermanent: false,
              isBot: false
            } as ChatRoomType
          }
          onClose={() => setShowCustomization(false)}
        />
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatRoom;