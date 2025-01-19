import React from 'react';
import { Bot, Users, Trash2, Lightbulb } from 'lucide-react';
import { useStore } from '../store';
import { ChatRoom } from '../types';

const RoomList: React.FC = () => {
  const { rooms, currentRoom, setCurrentRoom, deleteRoom } = useStore();

  // Fonction pour obtenir le timestamp du dernier message d'une room
  const getLastMessageTimestamp = (room: ChatRoom) => {
    if (!room.messages || Object.keys(room.messages).length === 0) return 0;
    const messages = Object.values(room.messages);
    return Math.max(...messages.map(msg => msg.timestamp));
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette room ?')) {
      await deleteRoom(roomId);
      if (currentRoom === roomId) {
        setCurrentRoom(null);
      }
    }
  };

  // Séparer et trier les rooms par catégorie
  const botRooms = rooms
    .filter(room => room.isBot && room.isPermanent)
    .sort((a, b) => getLastMessageTimestamp(b) - getLastMessageTimestamp(a));

  const userRooms = rooms
    .filter(room => !room.isPermanent && !room.isBot)
    .sort((a, b) => getLastMessageTimestamp(b) - getLastMessageTimestamp(a));

  const suggestionRoom = rooms.find(room => room.id === 'suggestions');

  const getBotIcon = (roomId: string, defaultIcon: string) => {
    switch (roomId) {
      case 'jester-asylum':
        return '🃏';
      case 'grok-domain':
        return '⚔️';
      default:
        return defaultIcon;
    }
  };

  const RoomItem = ({ room }: { room: ChatRoom }) => (
    <div
      onClick={() => setCurrentRoom(room.id)}
      className={`w-full flex items-center justify-between px-4 py-2 rounded-lg transition-colors cursor-pointer group ${
        currentRoom === room.id
          ? 'bg-purple-500/30'
          : 'hover:bg-purple-500/20'
      }`}
    >
      <div className="flex items-center gap-3 overflow-hidden">
        <span className="text-xl">{room.isBot ? getBotIcon(room.id, room.icon) : room.icon}</span>
        <span className="truncate">{room.name}</span>
        {room.isBot ? (
          <Bot className="w-4 h-4 text-purple-400" />
        ) : room.id === 'suggestions' && (
          <Lightbulb className="w-4 h-4 text-purple-400" />
        )}
        <div className="flex items-center gap-2 text-sm text-purple-400">
          <Users className="w-4 h-4" />
          <span>{room.users?.length || 0}</span>
        </div>
      </div>
      {!room.isPermanent && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteRoom(room.id);
          }}
          className="p-1 hover:bg-purple-500/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Bot Rooms - Fixed at top */}
      <div className="space-y-1 mb-2">
        <h3 className="text-xs font-semibold uppercase text-purple-400 px-4 py-2">
          Bot Rooms
        </h3>
        {botRooms.map(room => (
          <RoomItem key={room.id} room={room} />
        ))}
      </div>

      {/* User Rooms - Scrollable */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        <h3 className="text-xs font-semibold uppercase text-purple-400 px-4 py-2 sticky top-0 bg-black/90 backdrop-blur-sm z-10">
          User Rooms
        </h3>
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-purple-500/20 scrollbar-track-transparent hover:scrollbar-thumb-purple-500/30 pr-2 space-y-1">
          {userRooms.map(room => (
            <RoomItem key={room.id} room={room} />
          ))}
        </div>
      </div>

      {/* Suggestions Room - Fixed at bottom with more space */}
      {suggestionRoom && (
        <div className="mt-4 pt-2 border-t border-purple-500/20 mb-10">
          <h3 className="text-xs font-semibold uppercase text-purple-400 px-4 py-1">
            Suggestions
          </h3>
          <RoomItem room={suggestionRoom} />
        </div>
      )}
    </div>
  );
};

export default RoomList;