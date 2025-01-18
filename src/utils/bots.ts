import { nanoid } from 'nanoid';
import { Bot, Message } from '../types';
import { CohereClient } from 'cohere-ai';
import { JESTER_PROMPT, GROK_PROMPT, JESTER_FALLBACKS, GROK_FALLBACKS } from './cohere';
const MESSAGE_EXPIRY = 10 * 60 * 1000; // 10 minutes
const DEFAULT_MAX_TOKENS = 100;
const DEFAULT_TEMPERATURE = 0.8;
import { MESSAGE_EXPIRY, DEFAULT_MAX_TOKENS, DEFAULT_TEMPERATURE } from './constants';

let cohere: CohereClient | null = null;

if (import.meta.env.VITE_COHERE_API_KEY) {
  try {
    cohere = new CohereClient({
      token: import.meta.env.VITE_COHERE_API_KEY,
    });
  } catch (error) {
    console.error('Failed to initialize Cohere client:', error);
  }
}

const createBot = (name: string, prompt: string, fallbacks: string[]): Bot => ({
  generateResponse: async (message: string, context?: string): Promise<Message> => {
    if (!cohere) {
      return createFallbackMessage(name, fallbacks);
    }

    try {
      const response = await cohere.generate({
        prompt: `${prompt}\nMessage: ${message}\nContext: ${context || 'général'}`,
        maxTokens: DEFAULT_MAX_TOKENS,
        temperature: DEFAULT_TEMPERATURE,
        model: 'command-light',
      });

      return {
        id: nanoid(),
        userId: 'system',
        content: response.generations[0].text.trim(),
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