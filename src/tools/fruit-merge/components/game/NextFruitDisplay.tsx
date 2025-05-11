import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { FruitSpec } from '../../types';

interface NextFruitDisplayProps {
  nextFruitType: FruitSpec;
}

const NextFruitDisplay: React.FC<NextFruitDisplayProps> = ({ nextFruitType }) => {
  const { radius, color, name } = nextFruitType;


};

export default NextFruitDisplay;
