// src/tools/icp/icpAlgorithm.ts
import type { Point, ICPState } from "./types";
import { findClosestPoint, calculateCentroid, calculateError } from "./utils";

export const runICPAlgorithm = async (
  sourcePoints: Point[],
  targetPoints: Point[],
  maxIterations: number
): Promise<ICPState[]> => {
  return new Promise((resolve) => {
    // Initialize ICP states
    const states: ICPState[] = [];

    // Initial state - no transformation yet (iteration 0)
    let currentSourcePoints = sourcePoints.map((p) => ({ ...p })); // Deep copy
    let rotation = 0;
    let translation = { x: 0, y: 0 };

    // Add initial state (iteration 0) with no transformation
    states.push({
      sourcePoints: sourcePoints.map((p) => ({ ...p })),
      targetPoints: targetPoints.map((p) => ({ ...p })),
      transformedPoints: currentSourcePoints.map((p) => ({ ...p })),
      correspondences: sourcePoints.map((p, i) => [i, findClosestPoint(p, targetPoints)]),
      transformation: {
        rotation: 0,
        translation: { x: 0, y: 0 },
      },
      error: calculateError(
        sourcePoints,
        sourcePoints.map((p) => targetPoints[findClosestPoint(p, targetPoints)])
      ),
    });

    for (let iter = 0; iter < maxIterations; iter++) {
      // Find correspondences
      const correspondences: [number, number][] = [];
      for (let i = 0; i < currentSourcePoints.length; i++) {
        const closestIdx = findClosestPoint(currentSourcePoints[i], targetPoints);
        correspondences.push([i, closestIdx]);
      }

      // Calculate centroids
      const sourceCentroid = calculateCentroid(currentSourcePoints);
      const targetCentroid = calculateCentroid(
        correspondences.map(([srcIdx, tgtIdx]) => targetPoints[tgtIdx])
      );

      // Calculate optimal rotation
      let numerator = 0;
      let denominator = 0;

      for (let i = 0; i < correspondences.length; i++) {
        const [srcIdx, tgtIdx] = correspondences[i];
        const srcPoint = currentSourcePoints[srcIdx];
        const tgtPoint = targetPoints[tgtIdx];

        const srcDx = srcPoint.x - sourceCentroid.x;
        const srcDy = srcPoint.y - sourceCentroid.y;
        const tgtDx = tgtPoint.x - targetCentroid.x;
        const tgtDy = tgtPoint.y - targetCentroid.y;

        numerator += srcDx * tgtDy - srcDy * tgtDx;
        denominator += srcDx * tgtDx + srcDy * tgtDy;
      }

      const deltaRotation = Math.atan2(numerator, denominator);
      rotation += deltaRotation;

      // Apply rotation to source points (around the centroid)
      const rotatedPoints = currentSourcePoints.map((point) => {
        const cos = Math.cos(deltaRotation);
        const sin = Math.sin(deltaRotation);
        const dx = point.x - sourceCentroid.x;
        const dy = point.y - sourceCentroid.y;

        return {
          x: cos * dx - sin * dy + sourceCentroid.x,
          y: sin * dx + cos * dy + sourceCentroid.y,
        };
      });

      // Calculate translation to align centroids after rotation
      const newSourceCentroid = calculateCentroid(rotatedPoints);
      const deltaTranslation = {
        x: targetCentroid.x - newSourceCentroid.x,
        y: targetCentroid.y - newSourceCentroid.y,
      };

      // Update the accumulated translation
      translation = {
        x: translation.x + deltaTranslation.x,
        y: translation.y + deltaTranslation.y,
      };

      // Apply translation
      currentSourcePoints = rotatedPoints.map((point) => ({
        x: point.x + deltaTranslation.x,
        y: point.y + deltaTranslation.y,
      }));

      // Calculate error
      const error = calculateError(
        currentSourcePoints,
        correspondences.map(([srcIdx, tgtIdx]) => targetPoints[tgtIdx])
      );

      // Save state with the current transformation and deep copies to avoid reference issues
      const prevError = states.length > 0 ? states[states.length - 1].error : error;
      states.push({
        sourcePoints: sourcePoints.map((p) => ({ ...p })),
        targetPoints: targetPoints.map((p) => ({ ...p })),
        transformedPoints: currentSourcePoints.map((p) => ({ ...p })),
        correspondences: [...correspondences],
        transformation: {
          rotation,
          translation: { ...translation },
        },
        error,
        prevError,
      });
    }

    resolve(states);
  });
};
