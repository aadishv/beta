// src/tools/icp/AlgorithmParameters.tsx
import React from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Copy, ClipboardCheck, Trash2, RotateCcw, PenLine } from "lucide-react";

interface AlgorithmParametersProps {
  sourcePixelSpacing: number;
  setSourcePixelSpacing: React.Dispatch<React.SetStateAction<number>>;
  targetPixelSpacing: number;
  setTargetPixelSpacing: React.Dispatch<React.SetStateAction<number>>;
  maxIterations: number;
  setMaxIterations: React.Dispatch<React.SetStateAction<number>>;
  showCorrespondences: boolean;
  setShowCorrespondences: React.Dispatch<React.SetStateAction<boolean>>;
  activeIndex: number;
  setActiveIndex: React.Dispatch<React.SetStateAction<number>>;
  clearCurve: () => void;
  clearAll: () => void;
  runICP: () => void;
  curves: { points: { x: number; y: number }[]; color: string }[];
  importFromClipboard: (curveIndex: 0 | 1) => void;
  copyToClipboard: (points: { x: number; y: number }[]) => void;
}

const AlgorithmParameters: React.FC<AlgorithmParametersProps> = ({
  sourcePixelSpacing,
  setSourcePixelSpacing,
  targetPixelSpacing,
  setTargetPixelSpacing,
  maxIterations,
  setMaxIterations,
  showCorrespondences,
  setShowCorrespondences,
  activeIndex,
  setActiveIndex,
  clearCurve,
  clearAll,
  runICP,
  curves,
  importFromClipboard,
  copyToClipboard,
}) => {
  return (
    <div className="flex flex-wrap items-end gap-4 mb-4 w-full">
      {/* Curve selection */}
      <div className="flex flex-row items-center gap-2">
        <span className="font-medium pr-2">Curve:</span>
        <Button
          variant={activeIndex === 0 ? "default" : "outline"}
          onClick={() => setActiveIndex(0)}
          size="sm"
          className="flex items-center gap-2"
        >
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          Source
        </Button>
        <Button
          variant={activeIndex === 1 ? "default" : "outline"}
          onClick={() => setActiveIndex(1)}
          size="sm"
          className="flex items-center gap-2"
        >
          <div className="w-3 h-3 rounded-full bg-red-500" />
          Target
        </Button>
      </div>

      {/* Source Pixel Spacing */}
      <div className="flex flex-col items-start gap-2 min-w-[180px]">
        <label className="text-sm font-medium">Source Spacing: {sourcePixelSpacing}px</label>
        <Slider
          value={[sourcePixelSpacing]}
          min={2}
          max={50}
          step={1}
          onValueChange={(value) => setSourcePixelSpacing(value[0])}
        />
      </div>

      {/* Target Pixel Spacing */}
      <div className="flex flex-col items-start gap-2 min-w-[180px]">
        <label className="text-sm font-medium">Target Spacing: {targetPixelSpacing}px</label>
        <Slider
          value={[targetPixelSpacing]}
          min={2}
          max={50}
          step={1}
          onValueChange={(value) => setTargetPixelSpacing(value[0])}
        />
      </div>

      {/* Max Iterations */}
      <div className="flex flex-col items-start gap-2 min-w-[150px]">
        <label className="text-sm font-medium">Max Iterations: {maxIterations}</label>
        <Slider
          value={[maxIterations]}
          min={5}
          max={200}
          step={1}
          onValueChange={(value) => setMaxIterations(value[0])}
        />
      </div>

      {/* Show Correspondences */}
      <div className="flex flex-col items-start gap-2 min-w-[120px]">
        <label className="text-sm font-medium">Options</label>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="show-correspondences"
            checked={showCorrespondences}
            onChange={(e) => setShowCorrespondences(e.target.checked)}
            className="rounded border-gray-300 text-primary focus:ring-primary"
          />
          <label htmlFor="show-correspondences" className="text-sm font-medium">
            Show Lines
          </label>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col items-start gap-2 min-w-[320px] flex-1">
        <label className="text-sm font-medium">Actions</label>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={clearCurve} className="flex items-center gap-2">
            <Trash2 className="h-4 w-4" />
            Clear Current
          </Button>
          <Button variant="outline" size="sm" onClick={clearAll} className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4" />
            Clear All
          </Button>
          <Button
            onClick={runICP}
            className="flex items-center gap-2"
            size="sm"
            disabled={curves[0].points.length < 2 || curves[1].points.length < 2}
          >
            <PenLine className="h-4 w-4" />
            Run ICP
          </Button>
          <Button variant="outline" size="sm" onClick={() => copyToClipboard(curves[0].points)} className="flex items-center gap-2">
            <Copy className="h-4 w-4" />
            Copy Source
          </Button>
          <Button variant="outline" size="sm" onClick={() => importFromClipboard(0)} className="flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4" />
            Import Source
          </Button>
          <Button variant="outline" size="sm" onClick={() => copyToClipboard(curves[1].points)} className="flex items-center gap-2">
            <Copy className="h-4 w-4" />
            Copy Target
          </Button>
          <Button variant="outline" size="sm" onClick={() => importFromClipboard(1)} className="flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4" />
            Import Target
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AlgorithmParameters;
