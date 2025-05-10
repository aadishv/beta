// src/tools/icp-visualization/Canvas.tsx

import React, { useEffect, useRef } from "react";
import type { Point, Curve, ICPState } from "./types";

interface CanvasProps {
  curves: Curve[];
  activeIndex: number;
  isDrawing: boolean;
  setIsDrawing: React.Dispatch<React.SetStateAction<boolean>>;
  setCurves: React.Dispatch<React.SetStateAction<Curve[]>>;
  setActiveIndex: React.Dispatch<React.SetStateAction<number>>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  canvasContainerRef: React.RefObject<HTMLDivElement>;
  icpStates: ICPState[];
  currentStep: number;
  sourcePixelSpacing: number;
  targetPixelSpacing: number;
  showCorrespondences: boolean;
  setIcpStates: React.Dispatch<React.SetStateAction<ICPState[]>>;
  setCurrentStep: React.Dispatch<React.SetStateAction<number>>;
  transformMode: 'none' | 'translate' | 'rotate';
  transformCurveIndex: 0 | 1;
}

import { samplePoints, calculateCentroid } from "./utils";

const Canvas: React.FC<CanvasProps> = ({
  curves,
  activeIndex,
  isDrawing,
  setIsDrawing,
  setCurves,
  setActiveIndex,
  canvasRef,
  canvasContainerRef,
  icpStates,
  currentStep,
  sourcePixelSpacing,
  targetPixelSpacing,
  showCorrespondences,
  setIcpStates,
  setCurrentStep,
  transformMode,
  transformCurveIndex,
}) => {
  const isTransitioning = useRef(false);

  // Drag state for transform
  const dragStart = useRef<{ x: number, y: number } | null>(null);
  const originalPoints = useRef<Point[] | null>(null);
  const rotationStartAngle = useRef<number | null>(null);
  const centroid = useRef<Point | null>(null);

  // Initialize canvas size on mount and window resize
  useEffect(() => {
    const updateCanvasSize = () => {
      if (!canvasRef.current || !canvasContainerRef.current) return;

      const container = canvasContainerRef.current;
      const canvas = canvasRef.current;

      // Get the container's dimensions
      const rect = container.getBoundingClientRect();

      // Make the canvas square: use the smaller of width/height
      const size = Math.min(rect.width, rect.height);

      // Account for device pixel ratio
      const dpr = window.devicePixelRatio || 1;
      canvas.width = size * dpr;
      canvas.height = size * dpr;

      // Set CSS size (keeps layout correct)
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;

      // Scale the context so drawing operations are crisp
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset any existing transforms
        ctx.scale(dpr, dpr); // Scale for device pixel ratio
      }

      // Redraw canvas after resize
      drawCanvas();
    };

    // Initial setup
    updateCanvasSize();

    // Add resize listener
    window.addEventListener("resize", updateCanvasSize);

    return () => {
      window.removeEventListener("resize", updateCanvasSize);
    };
  }, []);

  // Update canvas when relevant state changes
  useEffect(() => {
    drawCanvas();
  }, [curves, icpStates, currentStep, sourcePixelSpacing, targetPixelSpacing, showCorrespondences]);

  // Safety mechanism to ensure isTransitioning doesn't get stuck
  useEffect(() => {
    const resetTransitionFlag = () => {
      isTransitioning.current = false;
    };

    // Reset the flag after a short delay to ensure it doesn't get stuck
    const timeoutId = setTimeout(resetTransitionFlag, 100);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [icpStates]); // Only depend on `icpStates` because `currentStep` will rerender it anyway

  // Map mouse coordinates to logical [-80, 80] coordinates
  const getMouseCoordinates = (e: React.MouseEvent<HTMLCanvasElement>): Point => {
    if (!canvasRef.current) return { x: 0, y: 0 };

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    // Get the position within the canvas element in pixels
    const px = (e.clientX - rect.left) * (canvas.width / rect.width);
    const py = (e.clientY - rect.top) * (canvas.height / rect.height);

    // Map to logical coordinates
    const logicalX = (px / canvas.width) * 160 - 80;
    const logicalY = 80 - (py / canvas.height) * 160;
    return { x: logicalX, y: logicalY };
  };

  // Handle mouse events for drawing and transform
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    if (transformMode === 'none') {
      setIsDrawing(true);
      const point = getMouseCoordinates(e);

      setCurves((prev) => {
        const newCurves = [...prev];
        newCurves[activeIndex] = {
          ...newCurves[activeIndex],
          points: [...newCurves[activeIndex].points, point],
        };
        return newCurves;
      });
      return;
    }

    // Transform mode
    if (transformMode === 'translate' || transformMode === 'rotate') {
      dragStart.current = getMouseCoordinates(e);
      originalPoints.current = curves[transformCurveIndex].points.map(p => ({ ...p }));
      if (transformMode === 'rotate') {
        centroid.current = calculateCentroid(originalPoints.current);
        const start = dragStart.current;
        rotationStartAngle.current = Math.atan2(start.y - centroid.current.y, start.x - centroid.current.x);
      }
      setIsDrawing(true);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;

    if (transformMode === 'none') {
      const point = getMouseCoordinates(e);

      setCurves((prev) => {
        const newCurves = [...prev];
        newCurves[activeIndex] = {
          ...newCurves[activeIndex],
          points: [...newCurves[activeIndex].points, point],
        };
        return newCurves;
      });
      return;
    }

    // Transform mode
    if (!dragStart.current || !originalPoints.current) return;
    const current = getMouseCoordinates(e);

    if (transformMode === 'translate') {
      const dx = current.x - dragStart.current.x;
      const dy = current.y - dragStart.current.y;
      setCurves(prev => {
        const newCurves = [...prev];
        newCurves[transformCurveIndex] = {
          ...newCurves[transformCurveIndex],
          points: originalPoints.current!.map(p => ({ x: p.x + dx, y: p.y + dy })),
        };
        return newCurves;
      });
    } else if (transformMode === 'rotate' && centroid.current && rotationStartAngle.current !== null) {
      const angleNow = Math.atan2(current.y - centroid.current.y, current.x - centroid.current.y + centroid.current.x - centroid.current.x);
      // Correction: should be Math.atan2(current.y - centroid.current.y, current.x - centroid.current.x)
      const correctedAngleNow = Math.atan2(current.y - centroid.current.y, current.x - centroid.current.x);
      const deltaAngle = correctedAngleNow - rotationStartAngle.current;
      setCurves(prev => {
        const newCurves = [...prev];
        newCurves[transformCurveIndex] = {
          ...newCurves[transformCurveIndex],
          points: originalPoints.current!.map(p => {
            const dx = p.x - centroid.current!.x;
            const dy = p.y - centroid.current!.y;
            const cos = Math.cos(deltaAngle);
            const sin = Math.sin(deltaAngle);
            return {
              x: centroid.current!.x + cos * dx - sin * dy,
              y: centroid.current!.y + sin * dx + cos * dy,
            };
          }),
        };
        return newCurves;
      });
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    dragStart.current = null;
    originalPoints.current = null;
    rotationStartAngle.current = null;
    centroid.current = null;
  };

  const handleMouseLeave = () => {
    setIsDrawing(false);
    dragStart.current = null;
    originalPoints.current = null;
    rotationStartAngle.current = null;
    centroid.current = null;
  };

  const clearCurve = () => {
    setCurves((prev) => {
      const newCurves = [...prev];
      newCurves[activeIndex] = { ...newCurves[activeIndex], points: [] };
      return newCurves;
    });
    setIcpStates([]);
    setCurrentStep(0);
  };

  const clearAll = () => {
    setCurves([
      { points: [], color: "#3b82f6" },
      { points: [], color: "#ef4444" },
    ]);
    setIcpStates([]);
    setCurrentStep(0);
  };

  // Map logical [-80, 80] coordinates to canvas pixel coordinates
  const logicalToCanvas = (x: number, y: number, width: number, height: number): { cx: number, cy: number } => {
    const cx = ((x + 80) / 160) * width;
    const cy = height - ((y + 80) / 160) * height;
    return { cx, cy };
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Always reset before drawing

    // Ensure we completely clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Drawing size constants for high-DPI comfort
    const circleRadius = 8;
    const curveLineWidth = 4;
    const transformedCurveLineWidth = 6;
    const correspondenceLineWidth = 2;

    // If we have no ICP states, draw the original curves using fixed logical coordinates
    if (icpStates.length === 0) {
      curves.forEach((curve, index) => {
        if (curve.points.length === 0) return;

        // Draw the curve
        ctx.strokeStyle = curve.color;
        ctx.lineWidth = curveLineWidth;
        ctx.beginPath();
        const { cx: x0, cy: y0 } = logicalToCanvas(curve.points[0].x, curve.points[0].y, canvas.width, canvas.height);
        ctx.moveTo(x0, y0);

        for (let i = 1; i < curve.points.length; i++) {
          const { cx, cy } = logicalToCanvas(curve.points[i].x, curve.points[i].y, canvas.width, canvas.height);
          ctx.lineTo(cx, cy);
        }
        ctx.stroke();

        // Draw the sample points if ICP is ready to run (both curves exist)
        if (curves[0].points.length > 0 && curves[1].points.length > 0) {
          const spacing = index === 0 ? sourcePixelSpacing : targetPixelSpacing;
          const sampledPoints = samplePoints(curve.points, spacing);

          // Draw circles at each sample point
          ctx.fillStyle = curve.color;
          sampledPoints.forEach((point) => {
            const { cx, cy } = logicalToCanvas(point.x, point.y, canvas.width, canvas.height);
            ctx.beginPath();
            ctx.arc(cx, cy, circleRadius, 0, Math.PI * 2);
            ctx.fill();

            // Add white border for better visibility
            ctx.strokeStyle = "white";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(cx, cy, circleRadius, 0, Math.PI * 2);
            ctx.stroke();
          });
        }
      });
    }
    // If we have ICP states and are on a valid step, draw the current state
    else if (icpStates.length > 0 && currentStep !== undefined) {
      const state = icpStates[currentStep];
      if (!state) return;

      const { rotation, translation } = state.transformation;

      // Create transformed source curve points by applying the current transformation
      const transformedSourceCurve: Point[] = [];
      if (curves[0].points.length > 0) {
        for (let i = 0; i < curves[0].points.length; i++) {
          // Apply the full accumulated transformation from the current state
          const originalPoint = curves[0].points[i];
          // ICP sometimes performs the rotation around the centroid, so we'll do the same
          const sourceCentroid = calculateCentroid(curves[0].points);

          // 1. Translate to origin based on source centroid
          const dx = originalPoint.x - sourceCentroid.x;
          const dy = originalPoint.y - sourceCentroid.y;

          // 2. Rotate
          const cos = Math.cos(rotation);
          const sin = Math.sin(rotation);
          const rotatedX = cos * dx - sin * dy;
          const rotatedY = sin * dx + cos * dy;

          // 3. Translate back and add the translation component
          const transformedPoint = {
            x: rotatedX + sourceCentroid.x + translation.x,
            y: rotatedY + sourceCentroid.y + translation.y,
          };

          transformedSourceCurve.push(transformedPoint);
        }
      }

      // Draw the target curve (red)
      ctx.strokeStyle = curves[1].color;
      ctx.lineWidth = transformedCurveLineWidth;
      ctx.beginPath();
      if (curves[1].points.length > 0) {
        const { cx: x0, cy: y0 } = logicalToCanvas(curves[1].points[0].x, curves[1].points[0].y, canvas.width, canvas.height);
        ctx.moveTo(x0, y0);

        for (let i = 1; i < curves[1].points.length; i++) {
          const { cx, cy } = logicalToCanvas(curves[1].points[i].x, curves[1].points[i].y, canvas.width, canvas.height);
          ctx.lineTo(cx, cy);
        }
      }
      ctx.stroke();

      // Draw the target sample points
      const targetPoints = state.targetPoints;
      ctx.fillStyle = curves[1].color;
      targetPoints.forEach((point) => {
        const { cx, cy } = logicalToCanvas(point.x, point.y, canvas.width, canvas.height);
        ctx.beginPath();
        ctx.arc(cx, cy, circleRadius, 0, Math.PI * 2);
        ctx.fill();

        // Add white border for better visibility
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, circleRadius, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Draw the transformed source curve (blue)
      ctx.strokeStyle = curves[0].color;
      ctx.lineWidth = transformedCurveLineWidth;
      ctx.beginPath();

      if (transformedSourceCurve.length > 0) {
        const { cx: x0, cy: y0 } = logicalToCanvas(transformedSourceCurve[0].x, transformedSourceCurve[0].y, canvas.width, canvas.height);
        ctx.moveTo(x0, y0);

        for (let i = 1; i < transformedSourceCurve.length; i++) {
          const { cx, cy } = logicalToCanvas(transformedSourceCurve[i].x, transformedSourceCurve[i].y, canvas.width, canvas.height);
          ctx.lineTo(cx, cy);
        }
      }
      ctx.stroke();

      // Draw the transformed source sample points
      const sourcePoints = state.transformedPoints;
      ctx.fillStyle = curves[0].color;
      sourcePoints.forEach((point) => {
        const { cx, cy } = logicalToCanvas(point.x, point.y, canvas.width, canvas.height);
        ctx.beginPath();
        ctx.arc(cx, cy, circleRadius, 0, Math.PI * 2);
        ctx.fill();

        // Add white border for better visibility
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, circleRadius, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Draw correspondence lines between points
      if (showCorrespondences && state.correspondences.length > 0) {
        ctx.strokeStyle = "rgba(150, 150, 150, 0.6)";
        ctx.lineWidth = correspondenceLineWidth;
        state.correspondences.forEach(([srcIdx, tgtIdx]) => {
          if (srcIdx < sourcePoints.length && tgtIdx < targetPoints.length) {
            const srcPoint = sourcePoints[srcIdx];
            const tgtPoint = targetPoints[tgtIdx];
            const { cx: srcX, cy: srcY } = logicalToCanvas(srcPoint.x, srcPoint.y, canvas.width, canvas.height);
            const { cx: tgtX, cy: tgtY } = logicalToCanvas(tgtPoint.x, tgtPoint.y, canvas.width, canvas.height);

            ctx.beginPath();
            ctx.moveTo(srcX, srcY);
            ctx.lineTo(tgtX, tgtY);
            ctx.stroke();
          }
        });
      }
    }

    // Mark transition as complete
    isTransitioning.current = false;
  };

  return (
    <div
      ref={canvasContainerRef}
      className="relative border rounded-md overflow-hidden flex items-center justify-center"
      style={{ aspectRatio: "1 / 1", width: "100%", maxWidth: "700px", maxHeight: "700px", minHeight: "400px", margin: "0 auto" }}
    >
      <canvas
        ref={canvasRef}
        className="bg-background cursor-crosshair"
        style={{ display: "block", width: "100%", height: "100%", aspectRatio: "1 / 1" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      />
    </div>
  );
};

export default Canvas;
