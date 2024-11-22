import React from 'react';

interface MessageInputProps {
  message: string;
  setMessage: (message: string) => void;
  onSend: () => Promise<void>;
  isGeneratingJoke: boolean;
  streamedResponse: string;
  disabled?: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  message,
  setMessage,
  onSend,
  isGeneratingJoke,
  streamedResponse
}) => {
  return (
    <div className="p-4 border-t border-gray-800">
      <div className="flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && onSend()}
          placeholder="Tape ton message ici..."
          className="flex-1 bg-gray-800 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
          disabled={isGeneratingJoke}
        />
        <button
          onClick={onSend}
          disabled={isGeneratingJoke || !message.trim()}
          className="bg-purple-500 hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg"
        >
          {isGeneratingJoke ? 'Envoi...' : 'Envoyer'}
        </button>
      </div>
      {streamedResponse && (
        <div className="mt-2 text-sm text-gray-400">{streamedResponse}</div>
      )}
    </div>
  );
};

MessageInput.displayName = 'MessageInput';