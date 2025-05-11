export interface FruitSpec {
  id: number;
  name: string;
  radius: number;
  color: string; // Tailwind color class
  nextFruitId: number | null; // null for the largest fruit
  scoreValue: number;
}

export interface TimelapseEvent {
  type: 'drop' | 'merge';
  timestamp: number; // ms since game start
  // For drop: fruitId, x position
  fruitId?: number;
  x?: number;
  // For merge: ids of merged fruits, resulting fruitId, position
  mergedIds?: string[];
  resultFruitId?: number;
  xOut?: number;
  yOut?: number;
}

export interface GameHistoryEntry {
  id: string;
  score: number;
  timestamp: number;
  timelapse: TimelapseEvent[];
  isNewRecord?: boolean;
  isCurrentHighScore?: boolean;
}

export interface ActiveFruit {
  id: string; // Unique instance ID
  fruitId: number; // FruitSpec ID
  x: number;
  y: number;
  radius: number;
  color: string;
  matterBodyId: number;
}

export interface GameState {
  activeFruits: ActiveFruit[];
  nextFruitType: FruitSpec;
  score: number;
  isGameOver: boolean;
  dropPreviewX: number;
}

export type GameAction = 
  | { type: 'DROP_FRUIT'; fruit: ActiveFruit }
  | { type: 'MERGE_FRUITS'; mergedIds: string[]; newFruit: ActiveFruit; scoreIncrease: number }
  | { type: 'UPDATE_FRUIT_POSITION'; id: string; x: number; y: number }
  | { type: 'SET_NEXT_FRUIT'; fruit: FruitSpec }
  | { type: 'UPDATE_DROP_PREVIEW'; x: number }
  | { type: 'GAME_OVER' }
  | { type: 'RESTART_GAME' };