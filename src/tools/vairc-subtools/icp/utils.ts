// src/tools/icp/utils.ts
import type { Point } from "./types";

export function copyToClipboard(data: Point[]) {
  const header = "x\ty\n";
  const csv = data.map(row => `${row.x}\t${row.y}`).join('\n');
  const text = header + csv;
  navigator.clipboard.writeText(text);
}

// Sample points from a curve based on pixel spacing with interpolation
export const samplePoints = (curve: Point[], pixelSpacing: number): Point[] => {
  if (curve.length <= 1) return curve;

  const result: Point[] = [];
  // Always include the first point
  result.push({ ...curve[0] });

  let distanceToNextSample = pixelSpacing;

  // Iterate through each segment of the curve
  for (let i = 1; i < curve.length; i++) {
    const segmentStart = curve[i-1];
    const segmentEnd = curve[i];

    // Calculate segment length
    const segmentLength = Math.sqrt(
      Math.pow(segmentEnd.x - segmentStart.x, 2) +
      Math.pow(segmentEnd.y - segmentStart.y, 2)
    );

    let remainingDistanceInSegment = segmentLength;
    let currentPointX = segmentStart.x;
    let currentPointY = segmentStart.y;

    // Continue sampling points along this segment until we reach its end
    while (remainingDistanceInSegment >= distanceToNextSample) {
      // Calculate how far along the segment the next sample should be
      const ratio = distanceToNextSample / remainingDistanceInSegment;

      // Calculate vector from current point to segment end
      const vectorX = segmentEnd.x - currentPointX;
      const vectorY = segmentEnd.y - currentPointY;

      // Interpolate to find the position
      const newX = currentPointX + ratio * vectorX;
      const newY = currentPointY + ratio * vectorY;

      // Add the interpolated point
      result.push({ x: newX, y: newY });

      // Update current point position
      currentPointX = newX;
      currentPointY = newY;

      // Update remaining distances
      remainingDistanceInSegment -= distanceToNextSample;
      distanceToNextSample = pixelSpacing;
    }

    // Carry over the remaining distance to the next segment
    distanceToNextSample -= remainingDistanceInSegment;
  }

  // Always include the last point if it's not already included
  const lastPoint = curve[curve.length - 1];
  const lastAddedIndex = result.length - 1;

  if (lastAddedIndex >= 0 &&
    (Math.abs(result[lastAddedIndex].x - lastPoint.x) > 0.001 ||
     Math.abs(result[lastAddedIndex].y - lastPoint.y) > 0.001)) {
    result.push({ ...lastPoint });
  }

  return result;
};



// Find closest point
export const findClosestPoint = (point: Point, points: Point[]): number => {
  let minDist = Number.POSITIVE_INFINITY;
  let minIndex = 0;

  for (let i = 0; i < points.length; i++) {
    const dist = Math.sqrt(Math.pow(point.x - points[i].x, 2) + Math.pow(point.y - points[i].y, 2));

    if (dist < minDist) {
      minDist = dist;
      minIndex = i;
    }
  }

  return minIndex;
};

// Calculate centroid of points
export const calculateCentroid = (points: Point[]): Point => {
  if (points.length === 0) return { x: 0, y: 0 };

  const sum = points.reduce((acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }), { x: 0, y: 0 });

  return {
    x: sum.x / points.length,
    y: sum.y / points.length,
  };
};

// Apply transformation to a single point
export const applyTransformationToPoint = (point: Point, rotation: number, translation: Point): Point => {
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);

  return {
    x: cos * point.x - sin * point.y + translation.x,
    y: sin * point.x + cos * point.y + translation.y,
  };
};

// Apply transformation to an array of points
export const applyTransformation = (points: Point[], rotation: number, translation: Point): Point[] => {
  return points.map((point) => applyTransformationToPoint(point, rotation, translation));
};

// Calculate mean squared error
export const calculateError = (points1: Point[], points2: Point[]): number => {
  if (points1.length !== points2.length) return Number.POSITIVE_INFINITY;
  if (points1.length === 0) return 0;

  let sum = 0;
  for (let i = 0; i < points1.length; i++) {
    sum += Math.pow(points1[i].x - points2[i].x, 2) + Math.pow(points1[i].y - points2[i].y, 2);
  }

  return sum / points1.length;
};
