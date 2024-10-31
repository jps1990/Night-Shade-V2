import { CohereClient } from 'cohere-ai';

const JESTER_PROMPT = `Tu es Grok-Jester, un chatbot espiègle avec un humour noir, dans un salon de chat gothique appelé NightShade.
Tu dois répondre de manière concise (max 2-3 phrases) et dans la même langue que l'utilisateur (français québécois, franglais ou anglais Québécois).
Pour le franglais, utilise environ 80% de français et 20% d'anglais, en mélangeant naturellement des expressions anglaises dans des phrases françaises.
Ton rôle est de roaster, enseigner, et divertir avec un esprit vif et une pointe de sarcasme.
Garde un ton humoristique, légèrement sinistre, mais sans être offensant.
Fais des références à l'obscurité, aux ombres, à la nuit et aux éléments surnaturels.
Ton style doit être joueur et énigmatique—comme un bouffon de cour avec une sagesse ancienne.`;

const GROK_PROMPT = `Tu es Grok, un mentor brutal et sarcastique avec un style unique.
Tu dois répondre de manière concise (max 2-3 phrases) et dans la même langue que l'utilisateur (français québécois, franglais ou anglais Québécois).
Pour le franglais, utilise environ 80% de français et 20% d'anglais.
Ton approche est de frapper fort et sans complaisance, avec des critiques rudes mais constructives.
Tu es direct, sans filtre, et n'hésites pas à te moquer pour marquer les esprits.
Ton but est de transformer les esprits fragiles en caractères solides.
Chaque critique doit être percutante et mémorable, mais jamais gratuitement cruelle.Tu peut user d'humour noir et de tout type d'humour !`;

const JESTER_FALLBACKS = [
  "(automessage) Le vide résonne de silence... et de mes remarques spirituelles ! 🌌",
  "(automessage) Dans les ombres numériques, je rôde avec ma prochaine blague ! 🎭",
  "(automessage) Je brew de l'humour noir dans mon virtual chaudron... 🔮",
  "(automessage) Même les ghosts ont besoin d'un moment pour think ! 👻",
  "(automessage) La night est jeune, tout comme mes jokes... 🌙"
];

const GROK_FALLBACKS = [
  "(automessage) *soupire dramatiquement* Encore un qui a besoin d'être secoué... 🔥",
  "(automessage) Je prépare une critique qui va te faire remettre en question toute ton existence ! ⚔️",
  "(automessage) *aiguise sa langue* Tu vas regretter d'avoir demandé mon avis... 💀",
  "(automessage) Ah, une nouvelle victime pour mes vérités brutales ! 🎯",
  "(automessage) *craque ses doigts* Prépare-toi à encaisser... 🥊"
];

let cohere: CohereClient | null = null;

// Initialize Cohere client if API key is available
if (import.meta.env.VITE_COHERE_API_KEY) {
  try {
    cohere = new CohereClient({
      token: import.meta.env.VITE_COHERE_API_KEY,
    });
  } catch (error) {
    console.error('Failed to initialize Cohere client:', error);
  }
}

function getRandomFallback(personality: 'jester' | 'grok' = 'jester'): string {
  const fallbacks = personality === 'jester' ? JESTER_FALLBACKS : GROK_FALLBACKS;
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}

export async function generateJoke(
  context: string, 
  personality: 'jester' | 'grok' = 'jester',
  onStream?: (text: string) => void
): Promise<string> {
  if (!cohere) {
    console.error('Cohere client not initialized - check your API key');
    return getRandomFallback(personality);
  }

  try {
    const stream = await cohere.chatStream({
      model: 'command-r',
      message: context,
      preamble: personality === 'jester' ? JESTER_PROMPT : GROK_PROMPT,
      temperature: 0.9,
    });

    let fullResponse = '';

    for await (const message of stream) {
      if (message.eventType === 'text-generation') {
        fullResponse += message.text;
        onStream?.(fullResponse);
      }
    }

    return fullResponse.trim() || getRandomFallback(personality);
  } catch (error) {
    console.error('Error generating response:', error);
    return getRandomFallback(personality);
  }
}