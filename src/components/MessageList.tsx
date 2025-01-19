import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useStore } from '../store';
import { Message, User } from '../types';

interface MessageListProps {
  messages: Message[];
  currentUser: User | null;
  currentRoom: string | null;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

export const MessageList: React.FC<MessageListProps> = ({ 
  messages, 
  currentUser,
  currentRoom,
  messagesEndRef 
}) => {
  const { rooms } = useStore();

  const getUserInfo = (userId: string): { name: string; avatar?: string } => {
    if (userId === currentUser?.id) {
      return { 
        name: currentUser.name,
        avatar: currentUser.avatar
      };
    }

    const room = rooms.find(r => r.id === currentRoom);
    if (room?.users) {
      // Convertir l'objet users en tableau si nécessaire
      const usersArray = Array.isArray(room.users) 
        ? room.users 
        : Object.values(room.users) as User[];
        
      const user = usersArray.find(u => u.id === userId);
      if (user) {
        return {
          name: user.name,
          avatar: user.avatar
        };
      }
    }

    return {
      name: "Utilisateur inconnu",
      avatar: undefined
    };
  };

  return (
    <div className="flex flex-col space-y-4 p-4">
      {messages.map((message) => {
        const isCurrentUser = message.userId === currentUser?.id;
        const userInfo = message.botName 
          ? { name: message.botName, avatar: undefined }
          : getUserInfo(message.userId);
        
        return (
          <div 
            key={message.id}
            className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[70%] space-y-1`}>
              <div className="flex items-center gap-2">
                {!isCurrentUser && (
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-purple-500/20 flex items-center justify-center">
                    {userInfo?.avatar ? (
                      <img 
                        src={userInfo.avatar} 
                        alt={userInfo.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-lg">{userInfo?.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                )}
                <div className={`text-sm opacity-70 ${isCurrentUser ? 'text-right' : 'text-left'}`}>
                  {userInfo?.name}
                </div>
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
      <div ref={messagesEndRef} />
    </div>
  );
};