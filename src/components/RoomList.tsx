import React from 'react';
import { Hash, Bot, Users, Trash2, Lightbulb } from 'lucide-react';
import { useStore } from '../store';

const RoomList: React.FC = () => {
  const store = useStore();
  const { rooms, currentRoom, setCurrentRoom, deleteRoom } = store;

  const handleDeleteRoom = (roomId: string) => {
    if (window.confirm('Are you sure you want to delete this room?')) {
      deleteRoom(roomId);
    }
  };

  // Separate rooms into categories
  const botRooms = rooms.filter(room => room.isBot && room.isPermanent);
  const userRooms = rooms.filter(room => !room.isPermanent && !room.isBot);
  const suggestionRoom = rooms.find(room => room.id === 'suggestions');

  const RoomItem = ({ room }: { room: any }) => (
    <div
      onClick={() => setCurrentRoom(room.id)}
      className={`w-full flex items-center justify-between px-4 py-2 rounded-lg transition-all cursor-pointer ${
        currentRoom === room.id
          ? 'bg-purple-500/30'
          : 'hover:bg-purple-500/20'
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        {room.isBot ? (
          <Bot className="w-4 h-4 flex-shrink-0" />
        ) : room.id === 'suggestions' ? (
          <Lightbulb className="w-4 h-4 flex-shrink-0" />
        ) : (
          <Hash className="w-4 h-4 flex-shrink-0" />
        )}
        <span className="truncate">{room.name}</span>
      </div>
      <div className="flex items-center gap-2 ml-2">
        <Users className="w-3 h-3 text-purple-400" />
        <span className="text-sm text-purple-400">{room.users.length}</span>
        {!room.isPermanent && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteRoom(room.id);
            }}
            className="p-1 hover:bg-red-500/20 rounded-full transition-colors"
          >
            <Trash2 className="w-3 h-3 text-red-400" />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Bot Rooms */}
      <div className="space-y-2">
        <h2 className="text-xs font-semibold text-purple-400 uppercase px-4">Bot Rooms</h2>
        {botRooms.map(room => (
          <RoomItem key={room.id} room={room} />
        ))}
      </div>

      {/* User Rooms */}
      {userRooms.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs font-semibold text-purple-400 uppercase px-4">User Rooms</h2>
          {userRooms.map(room => (
            <RoomItem key={room.id} room={room} />
          ))}
        </div>
      )}

      {/* Suggestions Room */}
      {suggestionRoom && (
        <div className="space-y-2">
          <h2 className="text-xs font-semibold text-purple-400 uppercase px-4">Suggestions</h2>
          <RoomItem room={suggestionRoom} />
        </div>
      )}
    </div>
  );
};

export default RoomList;