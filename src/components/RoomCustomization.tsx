import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useStore } from '../store';
import type { ChatRoom } from '../types';

const ROOM_ICONS = [
  '🌙', '👻', '🎭', '🖤', '🌌', '🎪', '🗝️', '🕯️', '🎩', '🔮',
  '⚰️', '🦇', '🕸️', '🌑', '🃏', '🗡️', '⚔️', '🏰', '🌘', '💀',
  '🧛', '🧙‍♂️', '🔱', '⚡', '🎲', '🎴', '🎨', '🌹', '🕷️', '🦉'
];

interface Props {
  room: ChatRoom;
  onClose: () => void;
}

export const RoomCustomization: React.FC<Props> = ({ room, onClose }) => {
  const { updateRoom } = useStore();
  const [name, setName] = useState(room.name);
  const [icon, setIcon] = useState(room.icon);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!room.isPermanent) {
      await updateRoom(room.id, { name, icon });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">Personnaliser la Room</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Nom de la room
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={room.isPermanent}
              className="w-full bg-gray-800 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 outline-none disabled:opacity-50"
              placeholder="Nom de la room"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Icône
            </label>
            <div className="grid grid-cols-6 gap-2 mb-2">
              {ROOM_ICONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => !room.isPermanent && setIcon(emoji)}
                  className={`text-2xl p-2 rounded-lg transition-colors ${
                    icon === emoji 
                      ? 'bg-purple-500/30 ring-2 ring-purple-500' 
                      : 'hover:bg-gray-800'
                  } ${room.isPermanent ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={room.isPermanent}
                >
                  {emoji}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              disabled={room.isPermanent}
              className="w-full bg-gray-800 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 outline-none disabled:opacity-50"
              placeholder="Ou entrez un emoji personnalisé"
            />
          </div>

          {room.isPermanent && (
            <p className="text-sm text-yellow-500">
              Cette room est permanente et ne peut pas être modifiée.
            </p>
          )}

          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={room.isPermanent}
              className="px-4 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:hover:bg-purple-500"
            >
              Sauvegarder
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoomCustomization;