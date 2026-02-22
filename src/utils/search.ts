import { toHiragana, toRomaji } from 'wanakana';

export interface SearchableItem {
  id: string | number;
  name: string;
  englishName?: string;
  phoneticName?: string;
  [key: string]: any;
}

/**
 * Strips punctuation while preserving letters (all scripts), numbers, and whitespace.
 * Collapses resulting whitespace runs.
 * e.g. "Go!! Restart" → "Go Restart", "KiRa-KiRa Sensation!" → "KiRaKiRa Sensation"
 */
function stripPunctuation(str: string): string {
  return str
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Checks if an item matches the search query using fuzzy matching for Japanese/Romaji.
 *
 * Logic adapted from SongSearchPanel.tsx
 */

export function getLevenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1 // deletion
          )
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

const MAX_LEVENSHTEIN_DISTANCE = 3;

/**
 * Checks if an item matches the search query using fuzzy matching for Japanese/Romaji.
 * Includes phonetic name check and Levenshtein distance for fuzzy matching.
 */
export function fuzzySearch(item: SearchableItem, query: string): boolean {
  if (!query.trim()) return true;

  const q = query.toLowerCase();
  const queryHiragana = toHiragana(q, { passRomaji: false });
  const queryRomaji = toRomaji(queryHiragana);

  // Normalize romaji by removing spaces for better matching
  const normalizedQueryRomaji = queryRomaji.replace(/\s+/g, '');

  const phoneticName = item.phoneticName ?? '';
  const phoneticRomaji = toRomaji(phoneticName);
  const normalizedPhoneticRomaji = phoneticRomaji.replace(/\s+/g, '');

  const itemName = item.name.toLowerCase();
  const englishName = (item.englishName ?? '').toLowerCase();

  // Punctuation-stripped versions for matching through !, ?, #, ☆, etc.
  const strippedQ = stripPunctuation(q);
  const strippedItemName = stripPunctuation(itemName);
  const strippedEnglishName = stripPunctuation(englishName);

  // 1. Exact/Substring match (High priority)
  if (
    itemName.includes(q) ||
    strippedItemName.includes(strippedQ) ||
    phoneticName.includes(queryHiragana) ||
    normalizedPhoneticRomaji.includes(normalizedQueryRomaji) ||
    englishName.includes(q) ||
    strippedEnglishName.includes(strippedQ)
  ) {
    return true;
  }

  // 2. Levenshtein Distance (Fuzzy match)
  // Check against name, phonetic (converted to romaji for user input convenience), and english name
  // We check against original query 'q' for english/romanized inputs
  // and 'normalizedQueryRomaji' for phonetic inputs

  // Check English Name
  if (englishName && getLevenshteinDistance(englishName, q) <= MAX_LEVENSHTEIN_DISTANCE) {
    return true;
  }

  // Check Name (Japanese) - Levenshtein might not be great for Kanji directly against Romaji input,
  // but good for Kana if user types partial Kana
  // For Kanji names, simple Levenshtein against English input doesn't make sense unless we convert Name to Romaji
  // But we have phoneticName for that.

  // Check Phonetic Name (Romaji vs Romaji) - This handles "User types romaji, matches Japanese song"
  if (
    normalizedPhoneticRomaji &&
    getLevenshteinDistance(normalizedPhoneticRomaji, normalizedQueryRomaji) <=
      MAX_LEVENSHTEIN_DISTANCE
  ) {
    return true;
  }

  // Also check direct Kana distance if user typed Kana
  if (
    phoneticName &&
    getLevenshteinDistance(phoneticName, queryHiragana) <= MAX_LEVENSHTEIN_DISTANCE
  ) {
    return true;
  }

  return false;
}

// Keep searchMatch for backward compatibility or alias it
// Keep searchMatch for backward compatibility or alias it
export const searchMatch = fuzzySearch;

/**
 * Calculates a search relevance score. Higher is better.
 *
 * Scoring:
 * - 100: Exact match on Name (Japanese)
 * - 95: Exact match on English Name
 * - 90: Partial match on Name (Japanese) - Starts with
 * - 85: Partial match on English Name - Starts with
 * - 80: Partial match on Name (Japanese) - Contains
 * - 75: Partial match on English Name - Contains
 * - 70: Exact phonetic match (Hiragana)
 * - 65: Partial phonetic match (Hiragana) - Starts with
 * - 60: Partial phonetic match (Hiragana) - Contains
 * - 50 - distance: Fuzzy match (Levenshtein)
 * - 0: No match
 */
export function getSearchScore(item: SearchableItem, query: string): number {
  if (!query.trim()) return 0;

  const q = query.toLowerCase();
  const queryHiragana = toHiragana(q, { passRomaji: false });
  const queryRomaji = toRomaji(queryHiragana);
  const normalizedQueryRomaji = queryRomaji.replace(/\s+/g, '');

  const itemName = item.name.toLowerCase();
  const englishName = (item.englishName ?? '').toLowerCase();
  const phoneticName = item.phoneticName ?? '';
  const phoneticRomaji = toRomaji(phoneticName);
  const normalizedPhoneticRomaji = phoneticRomaji.replace(/\s+/g, '');

  // Punctuation-stripped versions
  const strippedQ = stripPunctuation(q);
  const strippedItemName = stripPunctuation(itemName);
  const strippedEnglishName = stripPunctuation(englishName);

  // 1. Exact Name Matches
  if (itemName === q || strippedItemName === strippedQ) return 100;
  if (englishName === q || strippedEnglishName === strippedQ) return 95;

  // 2. Starts With Matches
  if (itemName.startsWith(q) || strippedItemName.startsWith(strippedQ)) return 90;
  if (englishName.startsWith(q) || strippedEnglishName.startsWith(strippedQ)) return 85;

  // 3. Contains Matches
  if (itemName.includes(q) || strippedItemName.includes(strippedQ)) return 80;
  if (englishName.includes(q) || strippedEnglishName.includes(strippedQ)) return 75;

  // 4. Phonetic/Romaji Matches
  // Exact phonetic
  if (phoneticName === queryHiragana) return 70;
  if (normalizedPhoneticRomaji === normalizedQueryRomaji) return 70;

  // Starts with phonetic
  if (phoneticName.startsWith(queryHiragana)) return 65;
  if (normalizedPhoneticRomaji.startsWith(normalizedQueryRomaji)) return 65;

  // Contains phonetic
  if (phoneticName.includes(queryHiragana)) return 60;
  if (normalizedPhoneticRomaji.includes(normalizedQueryRomaji)) return 60;

  // 5. Fuzzy Matches (Levenshtein)
  // Check English Name
  if (englishName) {
    const dist = getLevenshteinDistance(englishName, q);
    if (dist <= MAX_LEVENSHTEIN_DISTANCE) return 50 - dist;
  }

  // Check Phonetic Romaji
  if (normalizedPhoneticRomaji) {
    const dist = getLevenshteinDistance(normalizedPhoneticRomaji, normalizedQueryRomaji);
    if (dist <= MAX_LEVENSHTEIN_DISTANCE) return 50 - dist;
  }

  // Check Direct Phonetic
  if (phoneticName) {
    const dist = getLevenshteinDistance(phoneticName, queryHiragana);
    if (dist <= MAX_LEVENSHTEIN_DISTANCE) return 50 - dist;
  }

  return 0; // No match
}
