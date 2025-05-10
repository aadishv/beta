import type React from "react"

import { useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Play, Pause, RotateCcw, StepForward, StepBack, Trash2, PenLine, Copy } from "lucide-react"

type Point = {
  x: number
  y: number
}

function copyToClipboard(data: Point[]) {
  const header = "x\\ty\\n";
  const csv = data.map(row => `${row.x}\\t${row.y}`).join('\\n');
  const text = header + csv;
  navigator.clipboard.writeText(text);
}

type Curve = {
  points: Point[];
  color: string
}

type ICPState = {
  sourcePoints: Point[]
  targetPoints: Point[]
  transformedPoints: Point[]
  correspondences: [number, number][]
  transformation: {
    rotation: number
    translation: { x: number; y: number }
  }
  error: number
  prevError?: number
}

export function ICPVisualization() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const canvasContainerRef = useRef<HTMLDivElement>(null)
  const [curves, setCurves] = useState<Curve[]>([
    { points: [], color: "#3b82f6" }, // Source curve (blue)
    { points: [], color: "#ef4444" }, // Target curve (red)
  ])
  const [activeIndex, setActiveIndex] = useState(0)
  const [isDrawing, setIsDrawing] = useState(false)
  const [icpStates, setIcpStates] = useState<ICPState[]>([])
  const [currentStep, setCurrentStep] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [sourcePixelSpacing, setSourcePixelSpacing] = useState(10)
  const [targetPixelSpacing, setTargetPixelSpacing] = useState(10)
  const [maxIterations, setMaxIterations] = useState(20)
  const [showCorrespondences, setShowCorrespondences] = useState(false)
  const animationRef = useRef<number | null>(null)
  const isTransitioning = useRef(false)

  // Initialize canvas size on mount and window resize
  useEffect(() => {
    const updateCanvasSize = () => {
      if (!canvasRef.current || !canvasContainerRef.current) return

      const container = canvasContainerRef.current
      const canvas = canvasRef.current

      // Get the container's dimensions
      const rect = container.getBoundingClientRect()

      // Set canvas dimensions to match container size
      canvas.width = rect.width
      canvas.height = rect.height

      // Redraw canvas after resize
      drawCanvas()
    }

    // Initial setup
    updateCanvasSize()

    // Add resize listener
    window.addEventListener("resize", updateCanvasSize)

    return () => {
      window.removeEventListener("resize", updateCanvasSize)
    }
  }, [])

  // Draw the canvas
  const drawCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Ensure we completely clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Calculate view bounds for auto-scaling
    const getBounds = (points: Point[]) => {
      if (points.length === 0) return { minX: 0, maxX: 0, minY: 0, maxY: 0 }
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
      points.forEach(p => {
        minX = Math.min(minX, p.x)
        maxX = Math.max(maxX, p.x)
        minY = Math.min(minY, p.y)
        maxY = Math.max(maxY, p.y)
      })
      return { minX, maxX, minY, maxY }
    }

    // If we have no ICP states, draw the original curves without scaling
    if (icpStates.length === 0) {
      // Draw both original curves directly without scaling
      curves.forEach((curve, index) => {
        if (curve.points.length === 0) return

        // Draw the curve
        ctx.strokeStyle = curve.color
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(curve.points[0].x, curve.points[0].y)

        for (let i = 1; i < curve.points.length; i++) {
          ctx.lineTo(curve.points[i].x, curve.points[i].y)
        }
        ctx.stroke()

        // Draw the sample points if ICP is ready to run (both curves exist)
        if (curves[0].points.length > 0 && curves[1].points.length > 0) {
          const spacing = index === 0 ? sourcePixelSpacing : targetPixelSpacing;
          const sampledPoints = samplePoints(curve.points, spacing);

          // Draw circles at each sample point
          ctx.fillStyle = curve.color;
          sampledPoints.forEach(point => {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
            ctx.fill();

            // Add white border for better visibility
            ctx.strokeStyle = "white";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
            ctx.stroke();
          });
        }
      })
    }
    // If we have ICP states and are on a valid step, draw the current state
    else if (currentStep < icpStates.length) {
      const state = icpStates[currentStep]
      const { rotation, translation } = state.transformation

      // Create transformed source curve points by applying the current transformation
      const transformedSourceCurve: Point[] = []
      if (curves[0].points.length > 0) {
        for (let i = 0; i < curves[0].points.length; i++) {
          // Apply the full accumulated transformation from the current state
          const originalPoint = curves[0].points[i]
          // ICP sometimes performs the rotation around the centroid, so we'll do the same
          const sourceCentroid = calculateCentroid(curves[0].points)

          // 1. Translate to origin based on source centroid
          const dx = originalPoint.x - sourceCentroid.x
          const dy = originalPoint.y - sourceCentroid.y

          // 2. Rotate
          const cos = Math.cos(rotation)
          const sin = Math.sin(rotation)
          const rotatedX = cos * dx - sin * dy
          const rotatedY = sin * dx + cos * dy

          // 3. Translate back and add the translation component
          const transformedPoint = {
            x: rotatedX + sourceCentroid.x + translation.x,
            y: rotatedY + sourceCentroid.y + translation.y
          }

          transformedSourceCurve.push(transformedPoint)
        }
      }

      // Get all points for auto-scaling
      const allPoints: Point[] = [...curves[1].points, ...transformedSourceCurve]

      // Calculate bounds for auto-scaling
      const bounds = getBounds(allPoints)
      const padding = 50 // Padding around the edges

      if (allPoints.length > 0) {
        // Calculate scale to fit everything in view while preserving aspect ratio
        const scaleX = (canvas.width - padding*2) / Math.max(1, bounds.maxX - bounds.minX)
        const scaleY = (canvas.height - padding*2) / Math.max(1, bounds.maxY - bounds.minY)
        const scale = Math.min(scaleX, scaleY)

        // Center the content
        const centerX = padding + (canvas.width - padding*2 - scale * (bounds.maxX - bounds.minX)) / 2
        const centerY = padding + (canvas.height - padding*2 - scale * (bounds.maxY - bounds.minY)) / 2

        // Draw the target curve (red)
          ctx.strokeStyle = curves[1].color
          ctx.lineWidth = 3
          ctx.beginPath()
          if (curves[1].points.length > 0) {
            const x0 = centerX + scale * (curves[1].points[0].x - bounds.minX)
            const y0 = centerY + scale * (curves[1].points[0].y - bounds.minY)
            ctx.moveTo(x0, y0)

            for (let i = 1; i < curves[1].points.length; i++) {
              const x = centerX + scale * (curves[1].points[i].x - bounds.minX)
              const y = centerY + scale * (curves[1].points[i].y - bounds.minY)
              ctx.lineTo(x, y)
            }
          }
          ctx.stroke()

          // Draw the target sample points
                const targetPoints = state.targetPoints;
                ctx.fillStyle = curves[1].color;
                targetPoints.forEach(point => {
                  const x = centerX + scale * (point.x - bounds.minX);
                  const y = centerY + scale * (point.y - bounds.minY);
                  ctx.beginPath();
                  ctx.arc(x, y, 4, 0, Math.PI * 2);
                  ctx.fill();

                  // Add white border for better visibility
                  ctx.strokeStyle = "white";
                  ctx.lineWidth = 1;
                  ctx.beginPath();
                  ctx.arc(x, y, 4, 0, Math.PI * 2);
                  ctx.stroke();
                });

          // Draw the transformed source curve (blue)
          ctx.strokeStyle = curves[0].color
          ctx.lineWidth = 3
          ctx.beginPath()

          if (transformedSourceCurve.length > 0) {
            const x0 = centerX + scale * (transformedSourceCurve[0].x - bounds.minX)
            const y0 = centerY + scale * (transformedSourceCurve[0].y - bounds.minY)
            ctx.moveTo(x0, y0)

            for (let i = 1; i < transformedSourceCurve.length; i++) {
              const x = centerX + scale * (transformedSourceCurve[i].x - bounds.minX)
              const y = centerY + scale * (transformedSourceCurve[i].y - bounds.minY)
              ctx.lineTo(x, y)
            }
          }
        ctx.stroke()

        // Draw the transformed source sample points
        const sourcePoints = state.transformedPoints;
        ctx.fillStyle = curves[0].color;
        sourcePoints.forEach(point => {
          const x = centerX + scale * (point.x - bounds.minX);
          const y = centerY + scale * (point.y - bounds.minY);
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, Math.PI * 2);
          ctx.fill();

          // Add white border for better visibility
          ctx.strokeStyle = "white";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, Math.PI * 2);
          ctx.stroke();
        });

        // Draw correspondence lines between points
        if (showCorrespondences && state.correspondences.length > 0) {
          ctx.strokeStyle = "rgba(150, 150, 150, 0.6)";
          ctx.lineWidth = 1;
          state.correspondences.forEach(([srcIdx, tgtIdx]) => {
            if (srcIdx < sourcePoints.length && tgtIdx < targetPoints.length) {
              const srcPoint = sourcePoints[srcIdx];
              const tgtPoint = targetPoints[tgtIdx];
              const srcX = centerX + scale * (srcPoint.x - bounds.minX);
              const srcY = centerY + scale * (srcPoint.y - bounds.minY);
              const tgtX = centerX + scale * (tgtPoint.x - bounds.minX);
              const tgtY = centerY + scale * (tgtPoint.y - bounds.minY);

              ctx.beginPath();
              ctx.moveTo(srcX, srcY);
              ctx.lineTo(tgtX, tgtY);
              ctx.stroke();
            }
          });
        }
      }
    }

    // Mark transition as complete
    isTransitioning.current = false
  }

  // Update canvas when relevant state changes
  useEffect(() => {
    drawCanvas()
  }, [curves, icpStates, currentStep, showCorrespondences])

  // Safety mechanism to ensure isTransitioning doesn't get stuck
  useEffect(() => {
    const resetTransitionFlag = () => {
      isTransitioning.current = false
    }

    // Reset the flag after a short delay to ensure it doesn't get stuck
    const timeoutId = setTimeout(resetTransitionFlag, 100)

    return () => {
      clearTimeout(timeoutId)
    }
  }, [currentStep])

  // Get accurate mouse coordinates relative to the canvas
  const getMouseCoordinates = (e: React.MouseEvent<HTMLCanvasElement>): Point => {
    if (!canvasRef.current) return { x: 0, y: 0 }

    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()

    // Calculate the scale factor between the CSS size and the actual canvas size
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    // Get the position within the canvas element
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY

    return { x, y }
  }

  // Handle mouse events for drawing
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return

    setIsDrawing(true)
    const point = getMouseCoordinates(e)

    setCurves((prev) => {
      const newCurves = [...prev]
      newCurves[activeIndex] = {
        ...newCurves[activeIndex],
        points: [...newCurves[activeIndex].points, point],
      }
      return newCurves
    })
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return

    const point = getMouseCoordinates(e)

    setCurves((prev) => {
      const newCurves = [...prev]
      newCurves[activeIndex] = {
        ...newCurves[activeIndex],
        points: [...newCurves[activeIndex].points, point],
      }
      return newCurves
    })
  }

  const handleMouseUp = () => {
    setIsDrawing(false)
  }

  const handleMouseLeave = () => {
    setIsDrawing(false)
  }

  // Clear the current curve
  const clearCurve = () => {
    setCurves((prev) => {
      const newCurves = [...prev]
      newCurves[activeIndex] = { ...newCurves[activeIndex], points: [] }
      return newCurves
    })
    setIcpStates([])
    setCurrentStep(0)
    stopAnimation()
  }

  // Clear all curves
  const clearAll = () => {
    setCurves([
      { points: [], color: "#3b82f6" },
      { points: [], color: "#ef4444" },
    ])
    setIcpStates([])
    setCurrentStep(0)
    stopAnimation()
  }

  // Sample points from a curve based on pixel spacing with interpolation
  const samplePoints = (curve: Point[], pixelSpacing: number): Point[] => {
    if (curve.length <= 1) return curve

    const result: Point[] = []
    // Always include the first point
    result.push({ ...curve[0] })

    let distanceToNextSample = pixelSpacing

    // Iterate through each segment of the curve
    for (let i = 1; i < curve.length; i++) {
      const segmentStart = curve[i-1]
      const segmentEnd = curve[i]

      // Calculate segment length
      const segmentLength = Math.sqrt(
        Math.pow(segmentEnd.x - segmentStart.x, 2) +
        Math.pow(segmentEnd.y - segmentStart.y, 2)
      )

      let remainingDistanceInSegment = segmentLength
      let currentPointX = segmentStart.x
      let currentPointY = segmentStart.y

      // Continue sampling points along this segment until we reach its end
      while (remainingDistanceInSegment >= distanceToNextSample) {
        // Calculate how far along the segment the next sample should be
        const ratio = distanceToNextSample / remainingDistanceInSegment

        // Calculate vector from current point to segment end
        const vectorX = segmentEnd.x - currentPointX
        const vectorY = segmentEnd.y - currentPointY

        // Interpolate to find the position
        const newX = currentPointX + ratio * vectorX
        const newY = currentPointY + ratio * vectorY

        // Add the interpolated point
        result.push({ x: newX, y: newY })

        // Update current point position
        currentPointX = newX
        currentPointY = newY

        // Update remaining distances
        remainingDistanceInSegment -= distanceToNextSample
        distanceToNextSample = pixelSpacing
      }

      // Carry over the remaining distance to the next segment
      distanceToNextSample -= remainingDistanceInSegment
    }

    // Always include the last point if it's not already included
    const lastPoint = curve[curve.length - 1]
    const lastAddedIndex = result.length - 1

    if (lastAddedIndex >= 0 &&
      (Math.abs(result[lastAddedIndex].x - lastPoint.x) > 0.001 ||
       Math.abs(result[lastAddedIndex].y - lastPoint.y) > 0.001)) {
      result.push({ ...lastPoint })
    }

    return result
  }

  // Find closest point
  const findClosestPoint = (point: Point, points: Point[]): number => {
    let minDist = Number.POSITIVE_INFINITY
    let minIndex = 0

    for (let i = 0; i < points.length; i++) {
      const dist = Math.sqrt(Math.pow(point.x - points[i].x, 2) + Math.pow(point.y - points[i].y, 2))

      if (dist < minDist) {
        minDist = dist
        minIndex = i
      }
    }

    return minIndex
  }

  // Calculate centroid of points
  const calculateCentroid = (points: Point[]): Point => {
    if (points.length === 0) return { x: 0, y: 0 }

    const sum = points.reduce((acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }), { x: 0, y: 0 })

    return {
      x: sum.x / points.length,
      y: sum.y / points.length,
    }
  }

  // Apply transformation to a single point
  const applyTransformationToPoint = (point: Point, rotation: number, translation: Point): Point => {
    // Simple transformation without centroids
    // This function is simpler but doesn't match how ICP accumulates transformations
    // That's why we use a different approach for the curve transformation
    const cos = Math.cos(rotation)
    const sin = Math.sin(rotation)

    return {
      x: cos * point.x - sin * point.y + translation.x,
      y: sin * point.x + cos * point.y + translation.y,
    }
  }

  // Apply transformation to an array of points
  const applyTransformation = (points: Point[], rotation: number, translation: Point): Point[] => {
    return points.map((point) => applyTransformationToPoint(point, rotation, translation))
  }

  // Calculate mean squared error
  const calculateError = (points1: Point[], points2: Point[]): number => {
    if (points1.length !== points2.length) return Number.POSITIVE_INFINITY
    if (points1.length === 0) return 0

    let sum = 0
    for (let i = 0; i < points1.length; i++) {
      sum += Math.pow(points1[i].x - points2[i].x, 2) + Math.pow(points1[i].y - points2[i].y, 2)
    }

    return sum / points1.length
  }

  // Run ICP algorithm
  const runICP = () => {
    if (curves[0].points.length < 2 || curves[1].points.length < 2) {
      alert("Please draw both curves first")
      return
    }

    // Sample points from both curves with different pixel spacings
    const sourcePoints = samplePoints(curves[0].points, sourcePixelSpacing)
    const targetPoints = samplePoints(curves[1].points, targetPixelSpacing)

    // Initialize ICP states
    const states: ICPState[] = []

    // Initial state - no transformation yet (iteration 0)
    let currentSourcePoints = sourcePoints.map(p => ({...p})) // Deep copy
    let rotation = 0
    let translation = { x: 0, y: 0 }

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
        sourcePoints.map((p) => targetPoints[findClosestPoint(p, targetPoints)]),
      ),
    })

    for (let iter = 0; iter < maxIterations; iter++) {
      // Find correspondences
      const correspondences: [number, number][] = []
      for (let i = 0; i < currentSourcePoints.length; i++) {
        const closestIdx = findClosestPoint(currentSourcePoints[i], targetPoints)
        correspondences.push([i, closestIdx])
      }

      // Calculate centroids
      const sourceCentroid = calculateCentroid(currentSourcePoints)
      const targetCentroid = calculateCentroid(correspondences.map(([srcIdx, tgtIdx]) => targetPoints[tgtIdx]))

      // Calculate optimal rotation
      let numerator = 0
      let denominator = 0

      for (let i = 0; i < correspondences.length; i++) {
        const [srcIdx, tgtIdx] = correspondences[i]
        const srcPoint = currentSourcePoints[srcIdx]
        const tgtPoint = targetPoints[tgtIdx]

        const srcDx = srcPoint.x - sourceCentroid.x
        const srcDy = srcPoint.y - sourceCentroid.y
        const tgtDx = tgtPoint.x - targetCentroid.x
        const tgtDy = tgtPoint.y - targetCentroid.y

        numerator += srcDx * tgtDy - srcDy * tgtDx
        denominator += srcDx * tgtDx + srcDy * tgtDy
      }

      const deltaRotation = Math.atan2(numerator, denominator)
      rotation += deltaRotation

      // Apply rotation to source points (around the centroid)
      const rotatedPoints = currentSourcePoints.map((point) => {
        const cos = Math.cos(deltaRotation)
        const sin = Math.sin(deltaRotation)
        const dx = point.x - sourceCentroid.x
        const dy = point.y - sourceCentroid.y

        return {
          x: cos * dx - sin * dy + sourceCentroid.x,
          y: sin * dx + cos * dy + sourceCentroid.y,
        }
      })

      // Calculate translation to align centroids after rotation
      const newSourceCentroid = calculateCentroid(rotatedPoints)
      const deltaTranslation = {
        x: targetCentroid.x - newSourceCentroid.x,
        y: targetCentroid.y - newSourceCentroid.y,
      }

      // Update the accumulated translation
      translation = {
        x: translation.x + deltaTranslation.x,
        y: translation.y + deltaTranslation.y,
      }

      // Apply translation
      currentSourcePoints = rotatedPoints.map((point) => ({
        x: point.x + deltaTranslation.x,
        y: point.y + deltaTranslation.y,
      }))

      // Calculate error
      const error = calculateError(
        currentSourcePoints,
        correspondences.map(([srcIdx, tgtIdx]) => targetPoints[tgtIdx]),
      )

      // Save state with the current transformation and deep copies to avoid reference issues
      const prevError = states.length > 0 ? states[states.length - 1].error : error
      states.push({
        sourcePoints: sourcePoints.map((p) => ({ ...p })),
        targetPoints: targetPoints.map((p) => ({ ...p })),
        transformedPoints: currentSourcePoints.map((p) => ({ ...p })),
        correspondences: [...correspondences],
        transformation: {
          rotation,
          translation: {...translation},
        },
        error,
        prevError,
      })
    }

    setIcpStates(states)
    setCurrentStep(0)
  }

  // Animation controls with speed proportional to log of error decrease
  const startAnimation = () => {
    setIsRunning(true)
    stopAnimation()

    // Use setTimeout with dynamic delay based on error reduction
    const animate = () => {
      // Calculate delay based on error decrease for the current step
      let delay = 300; // Default delay

      if (currentStep < icpStates.length - 1) {
        const currentState = icpStates[currentStep];
        const nextState = icpStates[currentStep + 1];
        const errorDecrease = Math.max(0.0001, currentState.error - nextState.error);

        // Logarithmic scaling of animation speed based on error decrease
        // Larger error decreases = faster animation (smaller delay)
        const baseDelay = 800;
        const minDelay = 100;
        const scaleFactor = Math.min(1, Math.max(0.1, Math.log10(1 + errorDecrease * 100)));
        delay = Math.max(minDelay, baseDelay * (1 - scaleFactor));
      }

      setCurrentStep((prev) => {
        if (prev >= icpStates.length - 1) {
          setIsRunning(false)
          return prev
        }
        return prev + 1
      })

      // Schedule next animation frame with calculated delay
      if (currentStep < icpStates.length - 1) {
        animationRef.current = window.setTimeout(animate, delay) as unknown as number;
      }
    }

    animationRef.current = window.setTimeout(animate, 300) as unknown as number
  }

  const stopAnimation = () => {
    if (animationRef.current !== null) {
      clearTimeout(animationRef.current)
      animationRef.current = null
    }
    setIsRunning(false)
  }

  // Improved step functions
  const stepForward = () => {
    stopAnimation()
    setCurrentStep((prev) => Math.min(prev + 1, icpStates.length - 1))
  }

  const stepBack = () => {
    stopAnimation()
    setCurrentStep((prev) => Math.max(prev - 1, 0))
  }

  const resetAnimation = () => {
    stopAnimation()
    setCurrentStep(0)
  }

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 border rounded-lg p-4 bg-card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Drawing Canvas</h2>
            <div className="flex space-x-2">
              <Button
                variant={activeIndex === 0 ? "default" : "outline"}
                onClick={() => setActiveIndex(0)}
                className="flex items-center gap-2"
              >
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                Source
              </Button>
              <Button
                variant={activeIndex === 1 ? "default" : "outline"}
                onClick={() => setActiveIndex(1)}
                className="flex items-center gap-2"
              >
                <div className="w-3 h-3 rounded-full bg-red-500" />
                Target
              </Button>
            </div>
          </div>

          <div ref={canvasContainerRef} className="relative border rounded-md overflow-hidden">
            <canvas
              ref={canvasRef}
              className="w-full h-[400px] bg-background cursor-crosshair"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
            />
          </div>

          <div className="flex justify-between mt-4">
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={clearCurve} className="flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
                Clear Current
              </Button>
              <Button variant="outline" size="sm" onClick={clearAll} className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4" />
                Clear All
              </Button>
            </div>
            <Button
              onClick={runICP}
              className="flex items-center gap-2"
              disabled={curves[0].points.length < 2 || curves[1].points.length < 2}
            >
              <PenLine className="h-4 w-4" />
              Run ICP
            </Button>
          </div>
          <div className="flex space-x-2 mt-4">
            <Button variant="outline" size="sm" onClick={() => copyToClipboard(curves[0].points)} className="flex items-center gap-2 w-40">
              <Copy className="h-4 w-4" />
              Copy Source
            </Button>
            <Button variant="outline" size="sm" onClick={() => copyToClipboard(curves[1].points)} className="flex items-center gap-2 w-40">
              <Copy className="h-4 w-4" />
              Copy Target
            </Button>
            <Button variant="outline" size="sm" onClick={() => { if (icpStates.length > 0) copyToClipboard(icpStates[currentStep].sourcePoints)}} className="flex items-center gap-2 w-40">
              <Copy className="h-4 w-4" />
              Copy Source Iteration
            </Button>
          </div>
        </div>

        <div className="flex-1 border rounded-lg p-4 bg-card">
          <h2 className="text-xl font-semibold mb-4">Algorithm Parameters</h2>

          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm font-medium">Source Pixel Spacing: {sourcePixelSpacing}px</label>
              </div>
              <Slider
                value={[sourcePixelSpacing]}
                min={2}
                max={50}
                step={1}
                onValueChange={(value) => setSourcePixelSpacing(value[0])}
              />

              <div className="flex justify-between mt-4">
                <label className="text-sm font-medium">Target Pixel Spacing: {targetPixelSpacing}px</label>
              </div>
              <Slider
                value={[targetPixelSpacing]}
                min={2}
                max={50}
                step={1}
                onValueChange={(value) => setTargetPixelSpacing(value[0])}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm font-medium">Max Iterations: {maxIterations}</label>
              </div>
              <Slider
                value={[maxIterations]}
                min={5}
                max={50}
                step={1}
                onValueChange={(value) => setMaxIterations(value[0])}
              />
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <input
                type="checkbox"
                id="show-correspondences"
                checked={showCorrespondences}
                onChange={(e) => setShowCorrespondences(e.target.checked)}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="show-correspondences" className="text-sm font-medium">
                Show Correspondence Lines
              </label>
            </div>

            {icpStates.length > 0 && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">Iteration Progress</h3>
                  <span className="text-sm text-muted-foreground">
                    {currentStep + 1} / {icpStates.length}
                  </span>
                </div>

                <Slider
                  value={[currentStep]}
                  min={0}
                  max={icpStates.length - 1}
                  step={1}
                  onValueChange={(value) => {
                    stopAnimation()
                    setCurrentStep(value[0])
                  }}
                />

                <div className="flex justify-center space-x-2">
                  <Button variant="outline" size="icon" onClick={resetAnimation} disabled={icpStates.length === 0}>
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={stepBack}
                    disabled={currentStep === 0 || icpStates.length === 0}
                  >
                    <StepBack className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={isRunning ? "destructive" : "default"}
                    size="icon"
                    onClick={isRunning ? stopAnimation : startAnimation}
                    disabled={icpStates.length === 0}
                  >
                    {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={stepForward}
                    disabled={currentStep === icpStates.length - 1 || icpStates.length === 0}
                  >
                    <StepForward className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {icpStates.length > 0 && currentStep < icpStates.length && (
              <div className="space-y-2 pt-4 border-t">
                <h3 className="font-medium">Current State</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-muted-foreground">Rotation:</div>
                  <div>{((icpStates[currentStep].transformation.rotation * 180) / Math.PI).toFixed(2)}°</div>

                  <div className="text-muted-foreground">Translation X:</div>
                  <div>{icpStates[currentStep].transformation.translation.x.toFixed(2)}px</div>

                  <div className="text-muted-foreground">Translation Y:</div>
                  <div>{icpStates[currentStep].transformation.translation.y.toFixed(2)}px</div>

                  <div className="text-muted-foreground">Error:</div>
                  <div>{icpStates[currentStep].error.toFixed(4)}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="border rounded-lg p-4 bg-card">
        <h2 className="text-xl font-semibold mb-2">How It Works</h2>
        <p className="text-muted-foreground">
          The Iterative Closest Point (ICP) algorithm aligns two point clouds by finding the optimal transformation
          (rotation and translation) that minimizes the distance between corresponding points. The algorithm follows
          these steps:
        </p>
        <ol className="list-decimal list-inside mt-2 space-y-1 text-muted-foreground">
          <li>Sample points from both curves (with potentially different pixel spacing intervals)</li>
          <li>For each point in the source curve, find the closest point in the target curve</li>
          <li>Calculate the optimal rotation and translation to align the corresponding points</li>
          <li>Apply the transformation to the source points</li>
          <li>Repeat for the specified number of iterations</li>
          <li>Animation speed adapts based on the error reduction (faster animation when error decreases more)</li>
        </ol>
      </div>
    </div>
  )
}


export default function App() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-8">
      <div className="w-full max-w-5xl">
        <h1 className="text-3xl font-bold mb-4">Iterative Closest Point Algorithm Visualization</h1>
        <p className="mb-6 text-muted-foreground">
          Draw two separate curves and see how the ICP algorithm aligns them. Use the controls to step through each
          iteration.
        </p>
        <ICPVisualization />
      </div>
    </main>
  )
}
