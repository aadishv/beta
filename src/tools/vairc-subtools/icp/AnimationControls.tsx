// src/tools/icp/AnimationControls.tsx
import React, { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, StepForward, StepBack } from "lucide-react";
import { Slider } from "@/components/ui/slider";

interface AnimationControlsProps {
  icpStates: any[]; // TODO: Replace any with the correct type
  currentStep: number;
  isRunning: boolean;
  setIsRunning: React.Dispatch<React.SetStateAction<boolean>>;
  setCurrentStep: React.Dispatch<React.SetStateAction<number>>;
}

const AnimationControls: React.FC<AnimationControlsProps> = ({
  icpStates,
  currentStep,
  isRunning,
  setIsRunning,
  setCurrentStep,
}) => {
  const animationRef = useRef<number | null>(null);

  // Animation controls with faster playback and correct play/pause logic
  const startAnimation = () => {
    stopAnimation();
    setIsRunning(true);

    let frame = currentStep;

    const animate = () => {
      frame += 1;
      setCurrentStep((prev) => {
        if (prev >= icpStates.length - 1) {
          setIsRunning(false);
          return prev;
        }
        return prev + 1;
      });

      if (frame < icpStates.length - 1) {
        // Faster playback: 60ms per frame
        animationRef.current = window.setTimeout(animate, 60) as unknown as number;
      } else {
        setIsRunning(false);
      }
    };

    if (frame < icpStates.length - 1) {
      animationRef.current = window.setTimeout(animate, 60) as unknown as number;
    }
  };

  const stopAnimation = () => {
    if (animationRef.current !== null) {
      clearTimeout(animationRef.current);
      animationRef.current = null;
    }
    setIsRunning(false);
  };

  // Improved step functions
  const stepForward = () => {
    stopAnimation();
    setCurrentStep((prev) => Math.min(prev + 1, icpStates.length - 1));
  };

  const stepBack = () => {
    stopAnimation();
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const resetAnimation = () => {
    stopAnimation();
    setCurrentStep(0);
  };

  useEffect(() => {
    if (isRunning && icpStates.length > 0) {
      if (currentStep < icpStates.length - 1) {
        startAnimation();
      } else {
        setIsRunning(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, icpStates, currentStep]);

  return (
    <>
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
              stopAnimation();
              setCurrentStep(value[0]);
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
    </>
  );
};

export default AnimationControls;
