// src/tools/icp/HowItWorks.tsx
import React from "react";

const HowItWorks: React.FC = () => {
  return (
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
  );
};

export default HowItWorks;
