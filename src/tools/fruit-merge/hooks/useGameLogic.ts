import { useCallback, useEffect, useReducer, useRef } from 'react';
import Matter from 'matter-js';
import { v4 as uuidv4 } from 'uuid';
import type { ActiveFruit, FruitSpec, GameAction, GameState, TimelapseEvent } from '../types';
import { FRUIT_ORDER, getFruitById, getNextFruitInProgression, getRandomInitialFruit } from '../constants/fruits';
import {
  cleanupMatter,
  createContainerWalls,
  createEngine,
  createFruitBody,
  createOverflowSensor,
  createRunner,
  getWorld,
  isBodyAtRest,
  removeFruitBody,
  startRunner,
  updateFruitPosition,
} from '../lib/matter-setup';
import { saveGameHistoryEntry, getHighScore } from '../lib/history';

const initialState: GameState = {
  activeFruits: [],
  nextFruitType: getRandomInitialFruit(),
  score: 0,
  isGameOver: false,
  dropPreviewX: 0,
};

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'DROP_FRUIT':
      return {
        ...state,
        activeFruits: [...state.activeFruits, action.fruit],
        nextFruitType: getRandomInitialFruit(),
      };
    case 'MERGE_FRUITS':
      return {
        ...state,
        activeFruits: [
          ...state.activeFruits.filter(fruit => !action.mergedIds.includes(fruit.id)),
          action.newFruit,
        ],
        score: state.score + action.scoreIncrease,
      };
    case 'UPDATE_FRUIT_POSITION':
      return {
        ...state,
        activeFruits: state.activeFruits.map(fruit =>
          fruit.id === action.id
            ? { ...fruit, x: action.x, y: action.y }
            : fruit
        ),
      };
    case 'SET_NEXT_FRUIT':
      return {
        ...state,
        nextFruitType: action.fruit,
      };
    case 'UPDATE_DROP_PREVIEW':
      return {
        ...state,
        dropPreviewX: action.x,
      };
    case 'GAME_OVER':
      return {
        ...state,
        isGameOver: true,
      };
    case 'RESTART_GAME':
      return {
        ...initialState,
        nextFruitType: getRandomInitialFruit(),
      };
    default:
      return state;
  }
}

interface UseGameLogicProps {
  containerWidth: number;
  containerHeight: number;
  overflowLineY: number;
}

export function useGameLogic({ containerWidth, containerHeight, overflowLineY }: UseGameLogicProps) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const activeFruitsRef = useRef<ActiveFruit[]>(state.activeFruits);

  // Timelapse tracking
  const timelapseRef = useRef<TimelapseEvent[]>([]);
  const gameStartTimeRef = useRef<number>(Date.now());

  // Matter.js references
  const engineRef = useRef<Matter.Engine | null>(null);
  const runnerRef = useRef<Matter.Runner | null>(null);
  const worldRef = useRef<Matter.World | null>(null);
  const overflowSensorRef = useRef<Matter.Body | null>(null);
  const containerWallsRef = useRef<{ ground: Matter.Body; leftWall: Matter.Body; rightWall: Matter.Body } | null>(null);
  const gameOverTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastDropTimeRef = useRef<number>(0);
  const dropDelayMs = 300; // Delay between drops to prevent spam clicking

  // Keep ref up to date with latest activeFruits
  useEffect(() => {
    activeFruitsRef.current = state.activeFruits;
  }, [state.activeFruits]);

  // Set up Matter.js engine and world
  useEffect(() => {
    if (!containerWidth || !containerHeight) return;

    // Reset timelapse and game start time
    timelapseRef.current = [];
    gameStartTimeRef.current = Date.now();

    // Create engine and world
    const engine = createEngine();
    const world = getWorld(engine);
    const runner = createRunner();

    // Create container walls
    const walls = createContainerWalls(world, containerWidth, containerHeight);

    // Create overflow sensor
    const overflowSensor = createOverflowSensor(world, containerWidth, overflowLineY);

    // Start the runner
    startRunner(runner, engine);

    // Store references
    engineRef.current = engine;
    worldRef.current = world;
    runnerRef.current = runner;
    containerWallsRef.current = walls;
    overflowSensorRef.current = overflowSensor;

    // Set up collision detection
    Matter.Events.on(engine, 'collisionStart', handleCollisionStart);

    // Check for game over conditions
    const gameOverCheckInterval = setInterval(checkGameOverCondition, 500);

    return () => {
      // Clean up
      Matter.Events.off(engine, 'collisionStart', handleCollisionStart);
      clearInterval(gameOverCheckInterval);
      if (gameOverTimerRef.current) clearTimeout(gameOverTimerRef.current);
      cleanupMatter(engine, runner);

      engineRef.current = null;
      worldRef.current = null;
      runnerRef.current = null;
      containerWallsRef.current = null;
      overflowSensorRef.current = null;
    };
  }, [containerWidth, containerHeight, overflowLineY]);

  // Update fruit positions based on physics
  useEffect(() => {
    if (!engineRef.current || !worldRef.current || state.isGameOver) return;

    const updateInterval = setInterval(() => {
      // Process each active fruit to update its position from the physics engine
      const updatedFruits = state.activeFruits
        .map(fruit => {
          if (!worldRef.current) return null;
          return updateFruitPosition(fruit, worldRef.current);
        })
        .filter((fruit): fruit is ActiveFruit => fruit !== null);

      // Only update if there are fruits to update
      if (updatedFruits.length > 0) {
        // For each fruit with updated position, dispatch an update action
        updatedFruits.forEach(fruit => {
          dispatch({
            type: 'UPDATE_FRUIT_POSITION',
            id: fruit.id,
            x: fruit.x,
            y: fruit.y,
          });
        });
      }
    }, 16); // ~60fps

    return () => clearInterval(updateInterval);
  }, [state.activeFruits, state.isGameOver]);

  // Handle collisions between fruits
const handleCollisionStart = useCallback((event: Matter.IEventCollision<Matter.Engine>) => {
  if (!worldRef.current || state.isGameOver) return;

  const pairs = event.pairs;

  console.log("Collision event fired. Number of pairs:", pairs.length);

  // Process each collision pair
  for (let i = 0; i < pairs.length; i++) {
    const pair = pairs[i];
    const bodyA = pair.bodyA;
    const bodyB = pair.bodyB;

    // Log the bodies and their fruitData
    console.log(`Pair ${i}:`, {
      bodyA: {
        id: bodyA.id,
        isStatic: bodyA.isStatic,
        fruitData: (bodyA as any).fruitData,
        label: bodyA.label,
        position: bodyA.position,
      },
      bodyB: {
        id: bodyB.id,
        isStatic: bodyB.isStatic,
        fruitData: (bodyB as any).fruitData,
        label: bodyB.label,
        position: bodyB.position,
      },
    });

    // Skip if either body doesn't have fruit data or if one is a wall/sensor
    if (
      !bodyA || !bodyB ||
      !(bodyA as any).fruitData || !(bodyB as any).fruitData ||
      bodyA.isStatic || bodyB.isStatic
    ) {
      continue;
    }

    const fruitDataA = (bodyA as any).fruitData;
    const fruitDataB = (bodyB as any).fruitData;

    console.log(`Checking for merge: fruitDataA:`, fruitDataA, "fruitDataB:", fruitDataB);

    // If fruits are the same type, merge them
    if (fruitDataA.fruitId === fruitDataB.fruitId) {
      // Find the active fruits in our state that match these bodies
      +      console.log("Trying to find fruitAData.id:", fruitDataA.id, "fruitBData.id:", fruitDataB.id, "in activeFruits:", activeFruitsRef.current.map(f => f.id));
             const fruitAData = activeFruitsRef.current.find(f => f.id === fruitDataA.id);
             const fruitBData = activeFruitsRef.current.find(f => f.id === fruitDataB.id);

      console.log("Found activeFruits for merge?", !!fruitAData, !!fruitBData);

      // If both fruits exist in our state
      if (fruitAData && fruitBData) {
        const currentFruitType = getFruitById(fruitAData.fruitId);
        if (currentFruitType && currentFruitType.nextFruitId !== null) {
          const nextFruitType = getNextFruitInProgression(currentFruitType.id);

          if (nextFruitType) {
            // Calculate midpoint position for the new fruit
            const midX = (bodyA.position.x + bodyB.position.x) / 2;
            const midY = (bodyA.position.y + bodyB.position.y) / 2;

            console.log(`Merging fruits: ${currentFruitType.name} + ${currentFruitType.name} = ${nextFruitType.name}`);

            // Remove the old fruits from the physics world
            removeFruitBody(worldRef.current, bodyA.id);
            removeFruitBody(worldRef.current, bodyB.id);

            // Record timelapse event for merge
            timelapseRef.current.push({
              type: 'merge',
              timestamp: Date.now() - gameStartTimeRef.current,
              mergedIds: [fruitAData.id, fruitBData.id],
              resultFruitId: nextFruitType.id,
              xOut: midX,
              yOut: midY,
            });

            // Create the new merged fruit
            const newFruit = createFruitBody(
              worldRef.current,
              nextFruitType,
              midX,
              midY
            );

            // Update state - the merged fruit will be added, and old ones removed
            dispatch({
              type: 'MERGE_FRUITS',
              mergedIds: [fruitAData.id, fruitBData.id],
              newFruit,
              scoreIncrease: nextFruitType.scoreValue,
            });
            console.log("Dispatched MERGE_FRUITS action", {
              mergedIds: [fruitAData.id, fruitBData.id],
              newFruit,
              scoreIncrease: nextFruitType.scoreValue,
            });
          }
        }
      }
    }
  }
}, [state.activeFruits, state.isGameOver]);

  // Check if any fruits are above the overflow line and not moving
  const checkGameOverCondition = useCallback(() => {
    if (!worldRef.current || !engineRef.current || state.isGameOver) return;

    // Get all fruit bodies
    const bodies = Matter.Composite.allBodies(worldRef.current);

    // Filter for fruits that are above the overflow line
    const fruitsAboveOverflow = bodies.filter(body => {
      // Skip walls and sensors
      if (body.isStatic) return false;

      // Check if fruit is above overflow line and at rest
      if ((body as any).fruitData && body.position.y - body.circleRadius < overflowLineY) {
        return isBodyAtRest(body);
      }

      return false;
    });

    // If any fruits are above the overflow line and at rest, trigger game over
    if (fruitsAboveOverflow.length > 0 && !gameOverTimerRef.current) {
      gameOverTimerRef.current = setTimeout(() => {
        dispatch({ type: 'GAME_OVER' });
        gameOverTimerRef.current = null;
      }, 1500); // 1.5 second grace period before game over
    } else if (fruitsAboveOverflow.length === 0 && gameOverTimerRef.current) {
      // Clear the timer if all fruits move back below the line
      clearTimeout(gameOverTimerRef.current);
      gameOverTimerRef.current = null;
    }
  }, [state.isGameOver, overflowLineY]);

  // Drop a fruit at the specified position
  const dropFruit = useCallback((x: number) => {
    if (!worldRef.current || state.isGameOver) return;

    // Prevent rapid clicking
    const now = Date.now();
    if (now - lastDropTimeRef.current < dropDelayMs) return;
    lastDropTimeRef.current = now;

    // Create a new fruit body and add it to the world
    const newFruit = createFruitBody(
      worldRef.current,
      state.nextFruitType,
      x,
      overflowLineY - 10
    );

    // Record timelapse event
    timelapseRef.current.push({
      type: 'drop',
      timestamp: Date.now() - gameStartTimeRef.current,
      fruitId: state.nextFruitType.id,
      x,
    });

    // Update state
    dispatch({ type: 'DROP_FRUIT', fruit: newFruit });
  }, [state.nextFruitType, state.isGameOver, overflowLineY]);

  // Update the drop preview position
  const updateDropPreview = useCallback((x: number) => {
    if (state.isGameOver) return;

    // Ensure the preview stays within container bounds
    const radius = state.nextFruitType.radius;
    const boundedX = Math.max(radius, Math.min(containerWidth - radius, x));

    dispatch({ type: 'UPDATE_DROP_PREVIEW', x: boundedX });
  }, [state.nextFruitType, state.isGameOver, containerWidth]);

  // Restart the game
  const restartGame = useCallback(() => {
    if (!worldRef.current) return;

    // Remove all fruits from the world
    const bodies = Matter.Composite.allBodies(worldRef.current);
    bodies.forEach(body => {
      if (!body.isStatic && (body as any).fruitData) {
        Matter.Composite.remove(worldRef.current!, body);
      }
    });

    // Reset timelapse and game start time
    timelapseRef.current = [];
    gameStartTimeRef.current = Date.now();

    // Reset game state
    dispatch({ type: 'RESTART_GAME' });
    lastDropTimeRef.current = 0;

    if (gameOverTimerRef.current) {
      clearTimeout(gameOverTimerRef.current);
      gameOverTimerRef.current = null;
    }
  }, []);

  // Save game history on game over
  useEffect(() => {
    if (state.isGameOver && state.score > 0) {
      const historyId = uuidv4();
      const historyEntry = {
        id: historyId,
        score: state.score,
        timestamp: Date.now(),
        timelapse: timelapseRef.current,
      };
      // Determine if this is a new record or high score
      const prevHigh = getHighScore();
      historyEntry.isNewRecord = state.score > prevHigh;
      // isCurrentHighScore will be set by annotateGameHistory when displaying
      saveGameHistoryEntry(historyEntry);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.isGameOver]);

  return {
    state,
    dropFruit,
    updateDropPreview,
    restartGame,
  };
}
