import { nanoid } from 'nanoid';
import { Bot, Message } from '../types';
import { JESTER_PROMPT, GROK_PROMPT, JESTER_FALLBACKS, GROK_FALLBACKS } from './cohere';
import { MESSAGE_EXPIRY, DEFAULT_TEMPERATURE } from './constants';

const COHERE_API_KEY = import.meta.env.VITE_COHERE_API_KEY;
const COHERE_API_URL = 'https://api.cohere.com/v2/chat';

const createBot = (name: string, prompt: string, fallbacks: string[]): Bot => ({
  generateResponse: async (message: string, context?: string, onStream?: (text: string) => void): Promise<Message> => {
    if (!COHERE_API_KEY) {
      return createFallbackMessage(name, fallbacks);
    }

    try {
      const requestBody = {
        messages: [
          {
            role: "system",
            content: prompt + "\nContext: " + (context || 'général')
          },
          {
            role: "user",
            content: message
          }
        ],
        model: "command-r",
        temperature: DEFAULT_TEMPERATURE,
        stream: true
      };

      console.log('Request to Cohere:', requestBody);

      const response = await fetch(COHERE_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${COHERE_API_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Cohere API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`Erreur API Cohere: ${response.status} - ${errorText}`);
      }

      if (!response.body) {
        throw new Error('Pas de response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.trim() || !line.startsWith('data: ')) continue;
          
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'content-delta' && onStream) {
              const text = data.delta?.message?.content?.text || '';
              fullText += text;
              onStream(fullText);
            }
          } catch (e) {
            console.warn('Erreur parsing JSON:', e);
          }
        }
      }

      return {
        id: nanoid(),
        userId: 'system',
        content: fullText,
        timestamp: Date.now(),
        expiresAt: Date.now() + MESSAGE_EXPIRY,
        isBot: true,
        botName: name,
        context: context
      };

    } catch (error) {
      console.error('Error generating response:', error);
      return createFallbackMessage(name, fallbacks);
    }
  },
  reset: () => {}
});

const createFallbackMessage = (name: string, fallbacks: string[]): Message => ({
  id: nanoid(),
  userId: 'system',
  content: fallbacks[Math.floor(Math.random() * fallbacks.length)],
  timestamp: Date.now(),
  expiresAt: Date.now() + MESSAGE_EXPIRY,
  isBot: true,
  botName: name
});

export const jester = createBot('Jester', JESTER_PROMPT, JESTER_FALLBACKS);
export const grok = createBot('Grok', GROK_PROMPT, GROK_FALLBACKS); 