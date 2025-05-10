// src/tools/icp/ICPVisualization.tsx
import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, PenLine, RotateCcw, Trash2 } from "lucide-react";
import Canvas from "./Canvas";
import AlgorithmParameters from "./AlgorithmParameters";
import AnimationControls from "./AnimationControls";
import HowItWorks from "./HowItWorks";
import type { ICPState, Curve, Point } from "./types";
import { copyToClipboard } from "./utils";
import { ClipboardCheck } from "lucide-react";
import { samplePoints } from "./utils";
import { runICPAlgorithm } from "./icpAlgorithm"; // Import the ICP algorithm

export function ICPVisualization() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [curves, setCurves] = useState<Curve[]>([
    { points: [], color: "#3b82f6" }, // Source curve (blue)
    { points: [], color: "#ef4444" }, // Target curve (red)
  ]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [icpStates, setIcpStates] = useState<ICPState[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [sourcePixelSpacing, setSourcePixelSpacing] = useState(10);
  const [targetPixelSpacing, setTargetPixelSpacing] = useState(10);
  const [maxIterations, setMaxIterations] = useState(20);
  const [showCorrespondences, setShowCorrespondences] = useState(false);

  // Transform mode and curve selection
  const [transformMode, setTransformMode] = useState<'none' | 'translate' | 'rotate'>('none');
  const [transformCurveIndex, setTransformCurveIndex] = useState<0 | 1>(0);

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

  const runICP = async () => {
    if (curves[0].points.length < 2 || curves[1].points.length < 2) {
      alert("Please draw both curves first");
      return;
    }

    const sourcePoints = samplePoints(curves[0].points, sourcePixelSpacing);
    const targetPoints = samplePoints(curves[1].points, targetPixelSpacing);

    const result = await runICPAlgorithm(sourcePoints, targetPoints, maxIterations);

    setIcpStates(result);
    setCurrentStep(0);
  };

  // Helper to parse clipboard text into points
  const parsePointsFromClipboard = (text: string): Point[] => {
    // Expecting tab-separated values, possibly with a header
    const lines = text.trim().split(/\r?\n/);
    const points: Point[] = [];
    for (const line of lines) {
      if (/^\s*(x\s*\t\s*y|x\s*,\s*y)/i.test(line)) continue; // skip header
      const [x, y] = line.split(/\s*[\t,]\s*/).map(Number);
      if (!isNaN(x) && !isNaN(y)) {
        points.push({ x, y });
      }
    }
    return points;
  };

  // Import from clipboard for source or target
  const importFromClipboard = async (curveIndex: 0 | 1) => {
    try {
      const text = await navigator.clipboard.readText();
      let importedPoints = parsePointsFromClipboard(text);
      if (importedPoints.length > 0) {
        setCurves(prev => {
          const newCurves = [...prev];
          newCurves[curveIndex] = { ...newCurves[curveIndex], points: importedPoints };
          return newCurves;
        });
        setIcpStates([]);
        setCurrentStep(0);
      } else {
        alert("Clipboard does not contain valid points data.");
      }
    } catch (e) {
      alert("Failed to read from clipboard.");
    }
  };

  return (
    <div className="flex flex-col space-y-4">
      {/* Parameters bar */}
      <AlgorithmParameters
        sourcePixelSpacing={sourcePixelSpacing}
        setSourcePixelSpacing={setSourcePixelSpacing}
        targetPixelSpacing={targetPixelSpacing}
        setTargetPixelSpacing={setTargetPixelSpacing}
        maxIterations={maxIterations}
        setMaxIterations={setMaxIterations}
        showCorrespondences={showCorrespondences}
        setShowCorrespondences={setShowCorrespondences}
        activeIndex={activeIndex}
        setActiveIndex={setActiveIndex}
        clearCurve={clearCurve}
        clearAll={clearAll}
        runICP={runICP}
        curves={curves}
        importFromClipboard={importFromClipboard}
        copyToClipboard={copyToClipboard}
      />

      {/* Transform controls */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="font-medium">Transform:</span>
        <Button
          variant={transformMode === 'none' ? 'default' : 'outline'}
          onClick={() => setTransformMode('none')}
          size="sm"
        >
          None
        </Button>
        <Button
          variant={transformMode === 'translate' ? 'default' : 'outline'}
          onClick={() => setTransformMode(transformMode === 'translate' ? 'none' : 'translate')}
          size="sm"
        >
          Translate
        </Button>
        <Button
          variant={transformMode === 'rotate' ? 'default' : 'outline'}
          onClick={() => setTransformMode(transformMode === 'rotate' ? 'none' : 'rotate')}
          size="sm"
        >
          Rotate
        </Button>
        <span className="ml-4 font-medium">Curve:</span>
        <Button
          variant={transformCurveIndex === 0 ? 'default' : 'outline'}
          onClick={() => setTransformCurveIndex(0)}
          size="sm"
        >
          Source
        </Button>
        <Button
          variant={transformCurveIndex === 1 ? 'default' : 'outline'}
          onClick={() => setTransformCurveIndex(1)}
          size="sm"
        >
          Target
        </Button>
      </div>

      {/* Canvas */}
      <div className="border rounded-lg p-4 bg-card">
        <Canvas
          curves={curves}
          activeIndex={activeIndex}
          isDrawing={isDrawing}
          setIsDrawing={setIsDrawing}
          setCurves={setCurves}
          setActiveIndex={setActiveIndex}
          canvasRef={canvasRef}
          canvasContainerRef={canvasContainerRef}
          icpStates={icpStates}
          currentStep={currentStep}
          sourcePixelSpacing={sourcePixelSpacing}
          targetPixelSpacing={targetPixelSpacing}
          showCorrespondences={showCorrespondences}
          setIcpStates={setIcpStates}
          setCurrentStep={setCurrentStep}
          transformMode={transformMode}
          transformCurveIndex={transformCurveIndex}
        />
      </div>

      {/* Animation controls */}
      <div className="border rounded-lg p-4 bg-card">
        <AnimationControls
          icpStates={icpStates}
          currentStep={currentStep}
          isRunning={isRunning}
          setIsRunning={setIsRunning}
          setCurrentStep={setCurrentStep}
        />
      </div>

      <HowItWorks />
    </div>
  );
}

export default ICPVisualization;
