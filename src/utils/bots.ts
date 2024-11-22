import { nanoid } from 'nanoid';
import { Bot, Message } from '../types';
import { CohereClient } from 'cohere-ai';
import { JESTER_PROMPT, GROK_PROMPT, JESTER_FALLBACKS, GROK_FALLBACKS } from './cohere';

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
      const fallback = fallbacks[Math.floor(Math.random() * fallbacks.length)];
      return {
        id: nanoid(),
        userId: 'system',
        content: fallback,
        timestamp: Date.now(),
        expiresAt: Date.now() + (10 * 60 * 1000),
        isBot: true,
        botName: name
      };
    }

    try {
      const response = await cohere.generate({
        prompt: `${prompt}\nMessage: ${message}\nContext: ${context || 'général'}`,
        maxTokens: 100,
        temperature: 0.8,
        model: 'command',
      });

      return {
        id: nanoid(),
        userId: 'system',
        content: response.generations[0].text.trim(),
        timestamp: Date.now(),
        expiresAt: Date.now() + (10 * 60 * 1000),
        isBot: true,
        botName: name,
        context: context
      };
    } catch (error) {
      console.error('Error generating response:', error);
      const fallback = fallbacks[Math.floor(Math.random() * fallbacks.length)];
      return {
        id: nanoid(),
        userId: 'system',
        content: fallback,
        timestamp: Date.now(),
        expiresAt: Date.now() + (10 * 60 * 1000),
        isBot: true,
        botName: name
      };
    }
  },
  reset: () => {}
});

export const jester = createBot('Jester', JESTER_PROMPT, JESTER_FALLBACKS);
export const grok = createBot('Grok', GROK_PROMPT, GROK_FALLBACKS); 