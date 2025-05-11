import React, { useEffect, useRef, useState } from 'react';
import type { TimelapseEvent, FruitSpec, ActiveFruit } from '../../types';
import { FRUIT_ORDER, getFruitById, getNextFruitInProgression } from '../../constants/fruits';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Fruit from './Fruit';

interface TimelapsePlayerProps {
  timelapse: TimelapseEvent[];
  onBack: () => void;
}

const CONTAINER_WIDTH = 340;
const CONTAINER_HEIGHT = 510;
const OVERFLOW_LINE_Y = Math.round(CONTAINER_HEIGHT * 0.15);
const TIMELAPSE_DURATION = 10000; // 10 seconds

type ReplayFruit = ActiveFruit;

const TimelapsePlayer: React.FC<TimelapsePlayerProps> = ({ timelapse, onBack }) => {
  const [replayFruits, setReplayFruits] = useState<ReplayFruit[]>([]);
  const [progress, setProgress] = useState(0); // 0 to 1
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const fruitIdCounter = useRef(0);

  // Helper to create a unique fruit instance ID for replay
  const nextFruitInstanceId = () => {
    fruitIdCounter.current += 1;
    return `timelapse-fruit-${fruitIdCounter.current}`;
  };

  // Reset state on new timelapse
  useEffect(() => {
    setReplayFruits([]);
    setProgress(0);
    setIsPlaying(true);
    setCurrentStep(0);
    fruitIdCounter.current = 0;
  }, [timelapse]);

  // Main animation loop
  useEffect(() => {
    if (!isPlaying) return;
    startTimeRef.current = performance.now();
    let rafId: number;

    const totalGameTime = timelapse.length > 0
      ? Math.max(...timelapse.map(e => e.timestamp))
      : 1;

    const step = () => {
      const elapsed = performance.now() - startTimeRef.current;
      const mappedTime = (elapsed / TIMELAPSE_DURATION) * totalGameTime;
      setProgress(Math.min(1, elapsed / TIMELAPSE_DURATION));

      // Process all events up to mappedTime
      let stepIdx = currentStep;
      let fruits = [...replayFruits];

      while (
        stepIdx < timelapse.length &&
        timelapse[stepIdx].timestamp <= mappedTime
      ) {
        const event = timelapse[stepIdx];
        if (event.type === 'drop' && typeof event.fruitId === 'number' && typeof event.x === 'number') {
          const fruitSpec = getFruitById(event.fruitId) || FRUIT_ORDER[0];
          fruits.push({
            id: nextFruitInstanceId(),
            fruitId: fruitSpec.id,
            x: event.x,
            y: OVERFLOW_LINE_Y - 10,
            radius: fruitSpec.radius,
            color: fruitSpec.color,
            matterBodyId: 0,
          });
        } else if (
          event.type === 'merge' &&
          Array.isArray(event.mergedIds) &&
          typeof event.resultFruitId === 'number' &&
          typeof event.xOut === 'number' &&
          typeof event.yOut === 'number'
        ) {
          // Remove merged fruits
          fruits = fruits.filter(f => !event.mergedIds!.includes(f.id));
          // Add new merged fruit
          const fruitSpec = getFruitById(event.resultFruitId) || FRUIT_ORDER[0];
          fruits.push({
            id: nextFruitInstanceId(),
            fruitId: fruitSpec.id,
            x: event.xOut,
            y: event.yOut,
            radius: fruitSpec.radius,
            color: fruitSpec.color,
            matterBodyId: 0,
          });
        }
        stepIdx += 1;
      }

      if (stepIdx !== currentStep) {
        setReplayFruits(fruits);
        setCurrentStep(stepIdx);
      }

      if (elapsed < TIMELAPSE_DURATION) {
        rafId = requestAnimationFrame(step);
      } else {
        setIsPlaying(false);
        setProgress(1);
      }
    };

    rafId = requestAnimationFrame(step);
    animationRef.current = rafId;
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, timelapse]);

  // UI for the game container (no input)
  return (
    <div className="w-full max-w-2xl mx-auto py-8 px-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-2xl">Game Timelapse</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center">
            <div
              className="relative bg-gray-100 overflow-hidden rounded-lg shadow-inner mb-4"
              style={{
                width: "100%",
                maxWidth: `${CONTAINER_WIDTH}px`,
                height: `${CONTAINER_HEIGHT}px`,
                minHeight: `${CONTAINER_HEIGHT}px`,
              }}
            >
              {/* Container border */}
              <div className="absolute inset-0 border-2 border-gray-300 rounded-lg pointer-events-none" />
              {/* Overflow line */}
              <div
                className="absolute left-0 right-0 border-t border-red-400 border-dashed pointer-events-none"
                style={{ top: `${OVERFLOW_LINE_Y}px` }}
              />
              {/* Render all replay fruits */}
              {replayFruits.map((fruit) => (
                <Fruit key={fruit.id} fruitData={fruit} />
              ))}
              {/* Overlay to block input */}
              <div className="absolute inset-0 pointer-events-auto" />
            </div>
            <div className="w-full flex items-center gap-2 mt-2">
              <div className="flex-1 h-2 bg-gray-200 rounded overflow-hidden">
                <div
                  className="h-2 bg-orange-400 rounded transition-all"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 w-12 text-right">
                {(progress * 10).toFixed(1)}s
              </span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={onBack} variant="outline">
            Back to History
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default TimelapsePlayer;
