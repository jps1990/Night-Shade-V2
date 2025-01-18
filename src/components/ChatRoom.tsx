import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Edit, Users, Settings } from 'lucide-react';
import { useStore } from '../store';
import { MessageInput } from './MessageInput';
import { MessageList } from './MessageList';
import { RoomCustomization } from './RoomCustomization';
import { getDatabase, ref, onValue } from 'firebase/database';
import type { User, Message, ChatRoom as ChatRoomType } from '../types';

interface ChatRoomProps {
  currentRoom: string | null;
  currentUser: User | null;
}

const ChatRoom: React.FC<ChatRoomProps> = ({ currentRoom, currentUser }) => {
  const { addMessage, rooms, toggleSettings } = useStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState('');
  const [showCustomization, setShowCustomization] = useState(false);
  const [isGeneratingJoke, setIsGeneratingJoke] = useState(false);
  const [streamedResponse, setStreamedResponse] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentRoomData = rooms.find(r => r.id === currentRoom);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (!currentRoom) return;

    const database = getDatabase();
    const messagesRef = ref(database, `rooms/${currentRoom}/messages`);
    
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

  if (!currentRoom || !currentUser || !currentRoomData) {
    return <div className="flex-1 bg-gray-900 p-4">Sélectionne une room pour commencer...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{currentRoomData.icon}</span>
          <h2 className="text-xl font-bold">{currentRoomData.name}</h2>
          <div className="flex items-center gap-2 text-sm text-purple-400">
            <Users className="w-4 h-4" />
            <span>{currentRoomData.users?.length || 0}</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowCustomization(true)}
            className="p-2 hover:bg-gray-800 rounded-full transition-colors"
            title="Modifier la room"
          >
            <Edit className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleSettings}
              className="p-2 hover:bg-gray-800 rounded-full transition-colors"
              title="Paramètres"
            >
              <Settings className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 rounded-full overflow-hidden bg-purple-500/20 flex items-center justify-center">
              {currentUser.avatar ? (
                <img 
                  src={currentUser.avatar} 
                  alt={currentUser.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-lg">{currentUser.name.charAt(0).toUpperCase()}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto">
        <MessageList 
          messages={messages} 
          currentUser={currentUser} 
          messagesEndRef={messagesEndRef}
        />
      </div>
      
      {/* Input Fixed at Bottom */}
      <div className="mt-auto border-t border-gray-800">
        <MessageInput
          message={message}
          setMessage={setMessage}
          onSend={handleSend}
          isGeneratingJoke={isGeneratingJoke}
          streamedResponse={streamedResponse}
        />
      </div>

      {showCustomization && currentRoomData && (
        <RoomCustomization
          room={currentRoomData}
          onClose={() => setShowCustomization(false)}
        />
      )}
    </div>
  );
};

export default ChatRoom;