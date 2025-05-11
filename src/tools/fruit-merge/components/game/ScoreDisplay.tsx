import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ScoreDisplayProps {
  score: number;
}

const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ score }) => {
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-center">Score</CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        <div className="text-2xl font-bold text-primary">{score.toLocaleString()}</div>
      </CardContent>
    </Card>
  );
};

export default ScoreDisplay;