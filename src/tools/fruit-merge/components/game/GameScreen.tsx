import React, { useEffect, useState } from 'react';
import GameContainer from './GameContainer';
import ScoreDisplay from './ScoreDisplay';
import NextFruitDisplay from './NextFruitDisplay';
import GameOverDialog from './GameOverDialog';
import { useGameLogic } from '../../hooks/useGameLogic';

const GameScreen: React.FC = () => {
  // State for container dimensions
  const [dimensions, setDimensions] = useState({
    width: 0,
    height: 0,
    overflowLineY: 0,
  });

  // Calculate and set the game container size based on the window size
  useEffect(() => {
    const calculateDimensions = () => {
      // For mobile vs desktop sizing
      const isMobile = window.innerWidth < 768;
      
      // Calculate width - responsive based on screen size
      const containerWidth = isMobile
        ? Math.min(320, window.innerWidth - 32) 
        : Math.min(400, window.innerWidth * 0.4);
      
      // Calculate height - maintain aspect ratio (taller than wide)
      const containerHeight = containerWidth * 1.5;
      
      // Calculate overflow line position
      const overflowLineY = Math.round(containerHeight * 0.15);
      
      setDimensions({
        width: containerWidth,
        height: containerHeight,
        overflowLineY,
      });
    };

    // Initial calculation
    calculateDimensions();
    
    // Recalculate on window resize
    window.addEventListener('resize', calculateDimensions);
    return () => window.removeEventListener('resize', calculateDimensions);
  }, []);

  // Initialize game logic with container dimensions
  const { state, dropFruit, updateDropPreview, restartGame } = useGameLogic({
    containerWidth: dimensions.width,
    containerHeight: dimensions.height,
    overflowLineY: dimensions.overflowLineY,
  });

  // Extract game state
  const { activeFruits, nextFruitType, score, isGameOver, dropPreviewX } = state;

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
        {/* Game container */}
        <div className="flex-1 w-full md:w-auto flex justify-center">
          <GameContainer
            width={dimensions.width}
            height={dimensions.height}
            activeFruits={activeFruits}
            nextFruitType={nextFruitType}
            dropPreviewX={dropPreviewX}
            isGameOver={isGameOver}
            onDropFruit={dropFruit}
            onUpdateDropPreview={updateDropPreview}
          />
        </div>
        
        {/* Game info sidebar */}
        <div className="w-full md:w-64 flex flex-row md:flex-col gap-4 justify-center">
          <ScoreDisplay score={score} />
          <NextFruitDisplay nextFruitType={nextFruitType} />
        </div>
      </div>
      
      {/* Game over dialog */}
      <GameOverDialog
        isOpen={isGameOver}
        finalScore={score}
        onRestart={restartGame}
      />
    </div>
  );
};

export default GameScreen;