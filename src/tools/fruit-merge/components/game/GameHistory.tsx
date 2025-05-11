import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getGameHistory, annotateGameHistory } from '../../lib/history';
import type { GameHistoryEntry } from '../../types';

interface GameHistoryProps {
  onBack: () => void;
  onViewTimelapse: (entry: GameHistoryEntry) => void;
}

const GameHistory: React.FC<GameHistoryProps> = ({ onBack, onViewTimelapse }) => {
  const [history, setHistory] = useState<GameHistoryEntry[]>([]);

  useEffect(() => {
    const raw = getGameHistory();
    setHistory(annotateGameHistory(raw));
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto py-8 px-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-2xl">Game History</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <div className="text-center text-gray-500 py-8">No games played yet.</div>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto pr-1">
              <ol className="space-y-4">
                {history
                  .slice()
                  .reverse()
                  .map((entry, idx, arr) => {
                    // Formatting: bold if new record, underline if current high score
                    let scoreClass = '';
                    if (entry.isNewRecord) scoreClass += ' font-bold';
                    if (entry.isCurrentHighScore) scoreClass += ' underline underline-offset-4';
                    const date = new Date(entry.timestamp);
                    return (
                      <li
                        key={entry.id}
                        className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 p-3 rounded-lg bg-gray-50 border"
                      >
                        <div>
                          <span className={scoreClass}>
                            Score: {entry.score.toLocaleString()}
                          </span>
                          <span className="ml-4 text-xs text-gray-500">
                            {date.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onViewTimelapse(entry)}
                          >
                            View Timelapse
                          </Button>
                        </div>
                      </li>
                    );
                  })}
              </ol>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={onBack} variant="outline">
            Back to Menu
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default GameHistory;
