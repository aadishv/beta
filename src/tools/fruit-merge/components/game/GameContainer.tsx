import React, { useEffect, useRef, useState } from 'react';
import Matter from 'matter-js';
import Fruit from './Fruit';
import type { FruitSpec } from '../../types';

const DROP_INTERVAL = 0; // ms

interface GameContainerProps {
  width: number;
  height: number;
  activeFruits: any[];
  nextFruitType: FruitSpec;
  dropPreviewX: number;
  isGameOver: boolean;
  onDropFruit: (x: number) => void;
  onUpdateDropPreview: (x: number) => void;
}

const GameContainer: React.FC<GameContainerProps> = ({
  width,
  height,
  activeFruits,
  nextFruitType,
  dropPreviewX,
  isGameOver,
  onDropFruit,
  onUpdateDropPreview,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [overflowLineY, setOverflowLineY] = useState<number>(50); // Default value

  // Spacebar auto-drop state
  const [spaceHeld, setSpaceHeld] = useState(false);
  const dropIntervalRef = useRef<NodeJS.Timeout | null>(null);
  // Calculate the overflow line position (about 15% from the top)
  useEffect(() => {
    if (height) {
      setOverflowLineY(Math.round(height * 0.15));
    }
  }, [height]);

  // Handle mouse movement for fruit drop preview
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isGameOver) return;

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      onUpdateDropPreview(x);
    }
  };

  // Handle click to drop fruit
  const handleClick = () => {
    if (isGameOver) return;
    onDropFruit(dropPreviewX);
  };

  // Handle touch move for mobile
  const handleTouchMove = (e: React.TouchEvent) => {
    if (isGameOver || e.touches.length === 0) return;

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.touches[0].clientX - rect.left;
      onUpdateDropPreview(x);
    }
  };

  // Handle touch end for mobile
  const handleTouchEnd = () => {
    if (isGameOver) return;
    onDropFruit(dropPreviewX);
  };

  // Calculate the size of the preview fruit
  const previewSize = nextFruitType.radius * 2;

  // Spacebar auto-drop logic
  useEffect(() => {
    if (spaceHeld && !isGameOver) {
      // Drop immediately, then start interval
      onDropFruit(dropPreviewX);
      dropIntervalRef.current = setInterval(() => {
        onDropFruit(dropPreviewX);
      }, DROP_INTERVAL);
    } else {
      if (dropIntervalRef.current) {
        clearInterval(dropIntervalRef.current);
        dropIntervalRef.current = null;
      }
    }
    return () => {
      if (dropIntervalRef.current) {
        clearInterval(dropIntervalRef.current);
        dropIntervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spaceHeld, dropPreviewX, isGameOver]);

  // Listen for spacebar keydown/up globally
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.code === "Space" || e.key === " " || e.key === "Spacebar") && !spaceHeld) {
        setSpaceHeld(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.key === " " || e.key === "Spacebar") {
        setSpaceHeld(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [spaceHeld]);

  return (
    <div
      ref={containerRef}
      className="relative bg-gray-100 overflow-hidden rounded-lg shadow-inner"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        cursor: isGameOver ? 'default' : 'pointer',
      }}
      onMouseMove={handleMouseMove}
      onClick={handleClick}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Container border */}
      <div className="absolute inset-0 border-2 border-gray-300 rounded-lg pointer-events-none" />

      {/* Overflow line */}
      <div
        className="absolute left-0 right-0 border-t border-red-400 border-dashed pointer-events-none"
        style={{ top: `${overflowLineY}px` }}
      />

      {/* Fruit drop preview */}
      {!isGameOver && (
        <div
          className={`absolute ${nextFruitType.color} rounded-full opacity-50 pointer-events-none`}
          style={{
            width: `${previewSize}px`,
            height: `${previewSize}px`,
            left: `${dropPreviewX - nextFruitType.radius}px`,
            top: '0px',
          }}
        />
      )}

      {/* Render all active fruits */}
      {activeFruits.map((fruit) => (
        <Fruit key={fruit.id} fruitData={fruit} />
      ))}
    </div>
  );
};

export default GameContainer;
