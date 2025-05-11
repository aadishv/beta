import React from 'react';
import Modal from 'react-modal';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface GameOverDialogProps {
  isOpen: boolean;
  finalScore: number;
  onRestart: () => void;
}

Modal.setAppElement?.('body');

const GameOverDialog: React.FC<GameOverDialogProps> = ({
  isOpen,
  finalScore,
  onRestart,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      contentLabel="Game Over"
      overlayClassName="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center"
      className="outline-none border-none bg-transparent flex items-center justify-center"
      shouldCloseOnOverlayClick={false}
      shouldCloseOnEsc={false}
    >
      <Card className="w-full max-w-md mx-auto shadow-2xl">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Game Over!</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <p className="text-gray-600 mb-2">Your final score:</p>
            <p className="text-3xl font-bold text-primary">{finalScore.toLocaleString()}</p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button
            onClick={onRestart}
            className="w-full text-lg"
            autoFocus
          >
            Play Again
          </Button>
          <Button
            variant="outline"
            className="w-full text-lg"
            onClick={() => {
              // Custom event for parent to handle navigation
              const evt = new CustomEvent('fruit-merge-view-history');
              window.dispatchEvent(evt);
            }}
          >
            View History
          </Button>
        </CardFooter>
      </Card>
    </Modal>
  );
};

export default GameOverDialog;
