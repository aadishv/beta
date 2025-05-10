// aadishv.github.io/src/components/vairc/context/DetectionContext.tsx
import React, { createContext, useState, useContext } from 'react';
import type { Detection } from '../Layout';

// Define source types for highlighted detections
export type HighlightSource = 'details-panel' | 'field-view' | 'other' | null;

interface DetectionContextType {
  // The currently highlighted detection, if any
  highlightedDetection: Detection | null;
  // The source component that set the highlighted detection
  highlightSource: HighlightSource;
  // Function to set the highlighted detection with source information
  setHighlightedDetection: (detection: Detection | null, source?: HighlightSource) => void;
}

// Create the context with default values
const DetectionContext = createContext<DetectionContextType>({
  highlightedDetection: null,
  highlightSource: null,
  setHighlightedDetection: () => {}
});

// Provider component that will wrap the app
export const DetectionProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [highlightedDetection, setHighlightedDetection] = useState<Detection | null>(null);
  const [highlightSource, setHighlightSource] = useState<HighlightSource>(null);

  // Enhanced setter function that tracks the source
  const setHighlightWithSource = (detection: Detection | null, source: HighlightSource = 'other') => {
    setHighlightedDetection(detection);
    setHighlightSource(detection ? source : null);
  };

  return (
    <DetectionContext.Provider value={{ 
      highlightedDetection, 
      highlightSource,
      setHighlightedDetection: setHighlightWithSource 
    }}>
      {children}
    </DetectionContext.Provider>
  );
};

// Custom hook for using the detection context
export const useDetectionContext = () => useContext(DetectionContext);