import { BANNED_WORDS, FOOD_WHITELIST, INGREDIENT_CATS } from './constants';

export function containsBannedWord(text: string): boolean {
  const lower = text.toLowerCase().trim();
  if (FOOD_WHITELIST.some(w => lower === w || lower.includes(w))) return false;
  const multiWord = BANNED_WORDS.filter(b => b.includes(' '));
  if (multiWord.some(b => lower.includes(b))) return true;
  const singleWords = BANNED_WORDS.filter(b => !b.includes(' '));
  const inputWords = lower.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
  return inputWords.some(w => singleWords.includes(w));
}

export function categorize(ingredient: string): string {
  const lower = ingredient.toLowerCase();
  for (const [key, cat] of Object.entries(INGREDIENT_CATS)) {
    if (lower.includes(key)) return cat;
  }
  return 'PANTRY';
}

export function parseIngName(raw: string): string {
  return raw
    .replace(/^\d[\d\/\s]*(tbsp|tsp|cup|oz|lb|g|kg|ml|l|can|cloves?|large|small|medium|fresh|chopped|diced|sliced|minced|grated|ground|pinch|sheet|scoop|handful)?\s*/i, '')
    .replace(/\(.*?\)/g, '')
    .replace(/,.*$/, '')
    .trim();
}

export function recipeImgUrl(title: string, cuisine?: string): string {
  const query = encodeURIComponent(`${title} ${cuisine || ''} food dish`.trim().slice(0, 60));
  return `https://source.unsplash.com/400x300/?${query}`;
}

export function extractJSON(text: string): Record<string, unknown> | null {
  let s = text.replace(/```json\s*/gi, '').replace(/```/g, '').trim();
  s = s.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');
  const m = s.match(/\{[\s\S]*\}/);
  if (!m) return null;
  let str = m[0];
  try { return JSON.parse(str); } catch {}
  str = str.replace(/,(\s*[}\]])/g, '$1');
  try { return JSON.parse(str); } catch {}
  // Walk for balanced close brace
  let depth = 0, inStr = false, esc = false, end = -1;
  for (let i = 0; i < str.length; i++) {
    const c = str[i];
    if (esc) { esc = false; continue; }
    if (c === '\\') { esc = true; continue; }
    if (c === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) { end = i; break; } }
  }
  if (end > 0) try { return JSON.parse(str.slice(0, end + 1)); } catch {}
  return null;
}

export function extractJSONArray(text: string): unknown[] | null {
  const clean = text.replace(/```json\s*/gi, '').replace(/```/g, '').trim();
  const m = clean.match(/\[[\s\S]*\]/);
  if (!m) return null;
  let str = m[0];
  try { return JSON.parse(str); } catch {}
  str = str.replace(/,(\s*[}\]])/g, '$1');
  try { return JSON.parse(str); } catch {}
  return null;
}

export function detectPlatform(url: string) {
  if (url.includes('tiktok.com')) return { name: 'TikTok', icon: '🎵', type: 'tiktok' };
  if (url.includes('instagram.com')) return { name: 'Instagram', icon: '📸', type: 'instagram' };
  if (url.includes('youtube.com') || url.includes('youtu.be')) return { name: 'YouTube', icon: '▶️', type: 'youtube' };
  return { name: 'Web', icon: '🌐', type: 'web' };
}
