import React from 'react';
import type { ActiveFruit } from '../../types';

interface FruitProps {
  fruitData: ActiveFruit;
}

export const Fruit: React.FC<FruitProps> = ({ fruitData }) => {
  const { x, y, radius, color } = fruitData;

  // Calculate the size (diameter) from the radius
  const size = radius * 2;

  // Position the fruit using the center coordinates
  return (
    <div
      className={`absolute rounded-full ${color} shadow-md flex items-center justify-center`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        transform: `translate(${x - radius}px, ${y - radius}px)`,
        transition: 'transform 0.05s linear',
        zIndex: Math.floor(radius)
      }}
    />
  );
};

export default Fruit;
