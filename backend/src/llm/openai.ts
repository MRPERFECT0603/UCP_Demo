import Groq from 'groq-sdk';
import { SYSTEM_PROMPT, buildUserPrompt } from './prompt.js';
import { parseIntentResponse } from './parser.js';
import { ParsedIntent } from '../types/index.js';

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function extractIntent(
  message: string,
  conversationContext: string = ''
): Promise<ParsedIntent> {
  const userPrompt = buildUserPrompt(message, conversationContext);

  const response = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 512,
    temperature: 0,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt }
    ]
  });

  const text = response.choices[0]?.message?.content ?? '';
  return parseIntentResponse(text);
}
