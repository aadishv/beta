import React, { useState, useCallback } from 'react';
import GameScreen from './components/game/GameScreen';
import GameHistory from './components/game/GameHistory';
import TimelapsePlayer from './components/game/TimelapsePlayer';
import { Button } from '@/components/ui/button';
import type { GameHistoryEntry } from './types';

type View = 'menu' | 'game' | 'history' | 'timelapse';

export default function App() {
  const [view, setView] = useState<View>('menu');
  const [timelapseEntry, setTimelapseEntry] = useState<GameHistoryEntry | null>(null);

  // Listen for custom event from GameOverDialog to show history
  React.useEffect(() => {
    const handler = () => setView('history');
    window.addEventListener('fruit-merge-view-history', handler);
    return () => window.removeEventListener('fruit-merge-view-history', handler);
  }, []);

  // Navigation handlers
  const handleStartGame = useCallback(() => setView('game'), []);
  const handleBackToMenu = useCallback(() => setView('menu'), []);
  const handleViewHistory = useCallback(() => setView('history'), []);
  const handleViewTimelapse = useCallback((entry: GameHistoryEntry) => {
    setTimelapseEntry(entry);
    setView('timelapse');
  }, []);
  const handleBackToHistory = useCallback(() => setView('history'), []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-orange-100 py-8">
      <h1 className="text-3xl font-bold text-center text-orange-600 mb-8">Fruit Fusion</h1>
      {view === 'menu' && (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-lg">
            <h2 className="text-2xl font-bold mb-2">Welcome!</h2>
            <p className="text-lg text-gray-700 mb-8">
              Drop fruits into the container and watch them merge into larger fruits.
              How high can you score before they overflow?
            </p>
            <div className="flex flex-col gap-4">
              <Button
                onClick={handleStartGame}
                className="text-xl"
                size="lg"
              >
                Start Game
              </Button>
              <Button
                onClick={handleViewHistory}
                variant="outline"
                className="text-xl"
                size="lg"
              >
                View History
              </Button>
            </div>
          </div>
        </div>
      )}
      {view === 'game' && (
        <GameScreen />
      )}
      {view === 'history' && (
        <GameHistory
          onBack={handleBackToMenu}
          onViewTimelapse={handleViewTimelapse}
        />
      )}
      {view === 'timelapse' && timelapseEntry && (
        <TimelapsePlayer
          timelapse={timelapseEntry.timelapse}
          onBack={handleBackToHistory}
        />
      )}
    </div>
  );
}