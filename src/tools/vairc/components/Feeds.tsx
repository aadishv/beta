// aadishv.github.io/src/components/vairc/components/Feeds.tsx
import React, { useRef, useEffect, useState } from "react";
import DetectionCanvas from "./DetectionCanvas";
import { type DetectionPayload } from "../Layout";
import { ensureValidPayload } from "../utils/validation";

// Define our window components for the layout
export const ColorFeed: React.FC<{latestDetections: DetectionPayload, serverConfig: string}> = ({latestDetections, serverConfig}) => (
  <div className="w-full h-full flex items-center justify-center">
    <DetectionCanvas
      detections={ensureValidPayload(latestDetections)}
      serverConfig={serverConfig}
      imageEndpoint="color.mjpg"
      originalImageWidth={640}
      originalImageHeight={480}
      className="h-full"
    />
  </div>
);

export const DepthFeed: React.FC<{latestDetections: DetectionPayload, serverConfig: string}> = ({latestDetections, serverConfig}) => (
  <div className="w-full h-full flex items-center justify-center">
    <DetectionCanvas
      detections={ensureValidPayload(latestDetections)}
      serverConfig={serverConfig}
      imageEndpoint="depth.mjpg"
      originalImageWidth={640}
      originalImageHeight={480}
      className="h-full"
    />
  </div>
);

// BackCamera panel: MJPG stream from /color2.mjpg, no bounding boxes
export const BackCamera: React.FC<{latestDetections: DetectionPayload, serverConfig: string}> = ({latestDetections, serverConfig}) => (
  <div className="w-full h-full flex items-center justify-center">
    <DetectionCanvas
      detections={ensureValidPayload(latestDetections)}
      serverConfig={serverConfig}
      imageEndpoint="color2.mjpg"
      originalImageWidth={640}
      originalImageHeight={480}
      className="h-full"
    />
  </div>
);