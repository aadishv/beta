import type { GameHistoryEntry } from '../types';

// Key for localStorage
const STORAGE_KEY = 'fruit-merge-history';

// Get all game history entries from localStorage
export function getGameHistory(): GameHistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

// Save a new game entry to localStorage
export function saveGameHistoryEntry(entry: GameHistoryEntry) {
  const history = getGameHistory();
  history.push(entry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

// Clear all game history (for debugging or reset)
export function clearGameHistory() {
  localStorage.removeItem(STORAGE_KEY);
}

// Get the highest score from history
export function getHighScore(history?: GameHistoryEntry[]): number {
  const games = history ?? getGameHistory();
  return games.reduce((max, entry) => Math.max(max, entry.score), 0);
}

// Mark entries as new records and current high score
export function annotateGameHistory(history: GameHistoryEntry[]): GameHistoryEntry[] {
  let maxScore = 0;
  let highScoreIndex = -1;
  // Find the highest score and its index (last occurrence)
  history.forEach((entry, idx) => {
    if (entry.score >= maxScore) {
      maxScore = entry.score;
      highScoreIndex = idx;
    }
  });

  let prevMax = 0;
  return history.map((entry, idx) => {
    const isNewRecord = entry.score > prevMax;
    prevMax = Math.max(prevMax, entry.score);
    return {
      ...entry,
      isNewRecord,
      isCurrentHighScore: idx === highScoreIndex,
    };
  });
}
