import { ParsedIntent } from '../types/index.js';

export function parseIntentResponse(raw: string): ParsedIntent {
  try {
    // Strip markdown code fences if present
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);

    // Validate intent field exists
    if (!parsed.intent) {
      return { intent: 'UNKNOWN' };
    }

    return parsed as ParsedIntent;
  } catch {
    console.error('Failed to parse intent response:', raw);
    return { intent: 'UNKNOWN' };
  }
}
