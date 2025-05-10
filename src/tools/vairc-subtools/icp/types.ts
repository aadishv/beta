// src/tools/icp/types.ts

export type Point = {
  x: number;
  y: number;
};

export type Curve = {
  points: Point[];
  color: string;
};

export type ICPState = {
  sourcePoints: Point[];
  targetPoints: Point[];
  transformedPoints: Point[];
  correspondences: [number, number][];
  transformation: {
    rotation: number;
    translation: { x: number; y: number };
  };
  error: number;
  prevError?: number;
};
