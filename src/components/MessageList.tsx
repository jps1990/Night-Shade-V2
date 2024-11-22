import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useStore } from '../store';
import { Message, User } from '../types';

interface Props {
  messages: Message[];
  currentUser: User | null;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

export const MessageList: React.FC<Props> = ({ messages, currentUser, messagesEndRef }) => {
  const { rooms } = useStore();

  const getUserName = (userId: string) => {
    if (userId === currentUser?.id) return currentUser.name;
    for (const room of rooms) {
      const user = room.users.find(u => u.id === userId);
      if (user) return user.name;
    }
    return "Utilisateur inconnu";
  };

  return (
    <div className="flex flex-col space-y-4 p-4">
      {messages.map((message) => {
        const isCurrentUser = message.userId === currentUser?.id;
        const userName = message.botName || getUserName(message.userId);
        
        return (
          <div 
            key={message.id}
            className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[70%] space-y-1`}>
              <div className={`text-sm opacity-70 ${isCurrentUser ? 'text-right' : 'text-left'}`}>
                {userName}
              </div>
              <div className={`p-3 rounded-lg ${
                isCurrentUser ? 'bg-purple-500/20' : 'bg-blue-500/20'
              }`}>
                <div className="break-words">{message.content}</div>
                <div className="text-xs opacity-50 mt-1">
                  {formatDistanceToNow(new Date(message.timestamp), { 
                    addSuffix: true,
                    locale: fr 
                  })}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};