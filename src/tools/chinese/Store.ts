import { createStore } from "@xstate/store";
import { getSentences, CharState, type Sentence } from "./Data";

// Single storage key for all Chinese app data
const CHINESE_APP_STORAGE_KEY = "chinese_app_data";

/**
 * Loads saved application state from localStorage
 * @returns {Object|null} Parsed stored data or null if none exists
 */
export const loadFromStorage = () => {
  try {
    const storedData = localStorage.getItem(CHINESE_APP_STORAGE_KEY);
    if (storedData) {
      return JSON.parse(storedData);
    }
  } catch (error) {
    console.error("Failed to load data from localStorage:", error);
  }
  return null;
};

/**
 * Saves application state to localStorage
 * @param {any} data - Current application state to persist
 */
export const saveToStorage = (data: any) => {
  try {
    localStorage.setItem(CHINESE_APP_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Failed to save data to localStorage:", error);
  }
};
export type AppMode = "pinyin" | "character";

type HistoryType = {
  character: Record<string, [CharState, string]>;
  pinyin: Record<string, [CharState, string]>;
};

// Get all available lesson names
export const getAllLessons = (): string[] => {
  const allSentences = getSentences();
  const uniqueLessons = new Set<string>();

  allSentences.forEach((sentence) => {
    uniqueLessons.add(sentence.lesson);
  });

  return Array.from(uniqueLessons).sort();
};

// Load stored data and initialize context
const storedData = loadFromStorage();
const allLessons = getAllLessons();

const initialContext = {
  history: (storedData?.history || {
    character: {},
    pinyin: {},
  }) as HistoryType,
  sentences:
    storedData?.sentences ||
    ([...getSentences()].sort(() => 0.5 - Math.random()) as Sentence[]),
  sessions: (storedData?.sessions || {}) as Record<string, string>,
  completedCount: 0, // Always starts at 0 and is not persisted
  enabledLessons: storedData?.enabledLessons || allLessons, // Default to all lessons enabled
};

export const store = createStore({
  context: initialContext,
  on: {
    updateCharacter: (
      context,
      event: {
        character: string;
        newState: CharState;
        id: string;
        mode: AppMode;
      },
      enqueue,
    ) => {
      const lastState = context.history[event.character];
      const noChange = lastState && lastState[0] === event.newState;

      return {
        ...context,
        completedCount: context.completedCount + 1,
        history: noChange
          ? context.history
          : ({
              ...context.history,
              [event.mode]: {
                ...context.history[event.mode],
                [event.character]: [event.newState, event.id],
              },
            } as HistoryType),
      };
    },
    resetCompletedCount: (context, _, enqueue) => {
      const newContext = {
        ...context,
        completedCount: 0,
      };
      return newContext;
    },
    updateSession: (context, event: { key: string; date: Date }) => {
      return {
        ...context,
        sessions: {
          ...context.sessions,
          [event.key]: event.date.toISOString(),
        },
      };
    },
    progressSentence: (context) => {
      const enabledLessons = context.enabledLessons;
      let sentences = context.sentences.slice(1);
      if (sentences.length === 0) {
        sentences = [...getSentences()].sort(() => Math.random() - 0.5);
      }
      while (
        enabledLessons.length > 0 &&
        sentences.length > 0 &&
        !enabledLessons.includes(sentences[0].lesson)
      ) {
        console.log(sentences.length);
        sentences = sentences.slice(1);
        if (sentences.length === 0) {
          sentences = [...getSentences()].sort(() => Math.random() - 0.5);
        }
      }
      return {
        ...context,
        completedCount: 0,
        sentences: sentences,
      };
    },
    updateEnabledLessons: (context, event: { enabledLessons: string[] }) => {
      return {
        ...context,
        enabledLessons: event.enabledLessons,
      };
    },
    increaseCompletedCount: (context) => {
      return {
        ...context,
        completedCount: context.completedCount + 1,
      };
    },
  },
});

store.subscribe((snapshot) => saveToStorage(snapshot.context));
