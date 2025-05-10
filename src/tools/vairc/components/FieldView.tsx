// aadishv.github.io/src/components/vairc/components/FieldView.tsx
import React, { useEffect, useRef, useState } from "react";
import type { DetectionPayload, Pose } from "../Layout";
import { Card, CardContent } from "../../../components/ui/card";
import { safeGetStuff, isValidDetectionPayload } from "../utils/validation";

// Field View Panel Component
const FieldView: React.FC<{latestDetections: DetectionPayload | null, serverConfig: string}> = ({latestDetections}) => {
  // References for drawing
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Track when the image is actually loaded
  const [imageLoaded, setImageLoaded] = useState(false);

  // Effect to draw the field whenever detections or image loaded state changes
  useEffect(() => {
    // Skip if image is not loaded or no canvas
    if (!imageLoaded || !canvasRef.current) return;

    // Get the current pose directly from latest detections
    const currentPose = latestDetections?.pose || null;

    // Directly draw the field with the current pose
    const canvas = canvasRef.current;
    if (canvas) {
      drawField(canvas, currentPose, latestDetections);
    }
  }, [latestDetections, imageLoaded]);

  // Function to draw the field and robot with a specific pose
  const drawField = (canvas: HTMLCanvasElement, robotPose: Pose | null, detections: DetectionPayload | null) => {
    const image = imageRef.current;
    const container = containerRef.current;

    if (!canvas || !image || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Get container dimensions
    const containerRect = container.getBoundingClientRect();
    canvas.width = containerRect.width;
    canvas.height = containerRect.height;

    // Field dimensions in inches
    const FIELD_WIDTH_INCHES = 152;
    const FIELD_HEIGHT_INCHES = 152;

    // Robot dimensions in inches (18x18 inch square robot)
    const ROBOT_SIZE_INCHES = 18;

    // Calculate scaling factor to convert inches to pixels
    const scaleX = containerRect.width / FIELD_WIDTH_INCHES;
    const scaleY = containerRect.height / FIELD_HEIGHT_INCHES;
    const scale = Math.min(scaleX, scaleY); // Use the smaller scale to maintain aspect ratio

    // Calculate offset to center the field
    const offsetX = (containerRect.width - FIELD_WIDTH_INCHES * scale) / 2;
    const offsetY = (containerRect.height - FIELD_HEIGHT_INCHES * scale) / 2;

    // Function to convert field coordinates (inches, origin at center, y-up)
    // to canvas coordinates (pixels, origin at top-left, y-down)
    const fieldToCanvas = (fieldX: number, fieldY: number) => {
      // 1. Translate from field center origin to top-left origin
      const centeredX = fieldX + FIELD_WIDTH_INCHES / 2;
      const centeredY = FIELD_HEIGHT_INCHES / 2 - fieldY; // Invert Y-axis

      // 2. Scale from inches to pixels
      const pixelX = centeredX * scale + offsetX;
      const pixelY = centeredY * scale + offsetY;

      return { x: pixelX, y: pixelY };
    };

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw all detections first (behind the robot)
    if (isValidDetectionPayload(detections)) {
      const validDetections = safeGetStuff(detections);
      validDetections.forEach(detection => {
        // Only process detections that have absolute field coordinates
        if (detection && typeof detection === 'object' &&
            detection.fx !== undefined && detection.fy !== undefined && 
            typeof detection.fx === 'number' && typeof detection.fy === 'number') {
          // Calculate transparency based on confidence
          // Map from confidence range (0.2 - 1.0) to opacity range (0.0 - 1.0)
          const confidence = detection.confidence || 0;
          let opacity = 0;

          if (confidence <= 0.2) {
            opacity = 0; // Below 20% confidence is fully transparent
          } else if (confidence >= 1.0) {
            opacity = 1.0; // 100% confidence is fully opaque
          } else {
            // Linear interpolation between 0.2 and 1.0
            opacity = (confidence - 0.2) / 0.8;
          }

          // Set opacity for this detection
          ctx.globalAlpha = opacity; // 100% confidence is now fully opaque

          // All ring and goal coordinates are absolute
          const canvasPos = fieldToCanvas(detection.fx, detection.fy);
          const detectionClass = detection.class.toLowerCase();

          // Define sizes based on object type (in inches)
          let sizeInches = 0;
          switch (detectionClass) {
            case 'red':
            case 'blue':
              sizeInches = 8; // 8 inch OD for rings
              break;
            case 'goal':
              sizeInches = 10; // 10 inch OD for goals
              break;
            case 'bot':
              sizeInches = 18; // 18 inch OD for bots
              break;
            default:
              sizeInches = 8; // Default size
          }

          // Calculate pixel size
          const pixelSize = sizeInches * scale;

          // Create image path
          const imagePath = `/vairc/images/${detectionClass}.png`;

          // Create and use an image element
          const spriteImage = new Image();
          spriteImage.src = imagePath;

          // Function to draw the image properly cropped to square
          const drawCroppedImage = (img: HTMLImageElement) => {
            // Get image dimensions
            const imgWidth = img.naturalWidth;
            const imgHeight = img.naturalHeight;

            // Determine crop dimensions to make the image square
            let sourceX = 0;
            let sourceY = 0;
            let sourceSize = Math.min(imgWidth, imgHeight);

            // If width > height, crop from center of width
            if (imgWidth > imgHeight) {
              sourceX = (imgWidth - sourceSize) / 2;
            }
            // If height > width, crop from center of height
            else if (imgHeight > imgWidth) {
              sourceY = (imgHeight - sourceSize) / 2;
            }

            // Draw the cropped image
            ctx.drawImage(
              img,
              sourceX, sourceY,      // Source position (top-left of crop)
              sourceSize, sourceSize, // Source dimensions (crop to square)
              canvasPos.x - pixelSize/2, // Destination position
              canvasPos.y - pixelSize/2,
              pixelSize, pixelSize    // Destination dimensions
            );
          };

          // If image is already loaded, draw it immediately
          if (spriteImage.complete && spriteImage.naturalWidth) {
            drawCroppedImage(spriteImage);
          } else {
            // Draw a placeholder while the image loads
            spriteImage.onload = () => {
              drawCroppedImage(spriteImage);
            };

            // Fallback if image fails to load
            spriteImage.onerror = () => {
              console.error(`Failed to load image: ${imagePath}`);
              // Draw a colored circle as fallback with opacity based on confidence
              ctx.fillStyle = detectionClass === 'red' ? `rgba(255, 0, 0, ${opacity})`
                            : detectionClass === 'blue' ? `rgba(0, 0, 255, ${opacity})`
                            : detectionClass === 'goal' ? `rgba(255, 255, 0, ${opacity})`
                            : `rgba(128, 128, 128, ${opacity})`;
              ctx.beginPath();
              ctx.arc(canvasPos.x, canvasPos.y, pixelSize/2, 0, Math.PI * 2);
              ctx.fill();
            };
          }
        }
      });

      // Reset global alpha after drawing detections
      ctx.globalAlpha = 1.0;
    }

    // Draw the robot if we have pose data
    if (robotPose && 
        typeof robotPose === 'object' && 
        typeof robotPose.x === 'number' && 
        typeof robotPose.y === 'number' && 
        typeof robotPose.theta === 'number') {
      const { x, y, theta } = robotPose;

      // Convert robot position from field to canvas coordinates
      const canvasPos = fieldToCanvas(x, y);

      // Calculate robot size in pixels
      const robotSizePixels = ROBOT_SIZE_INCHES * scale;
      const halfSize = robotSizePixels / 2;

      // Define robot corners relative to its center position (in canvas pixel space)
      const corners = [
        { x: -halfSize, y: -halfSize }, // Top-left
        { x: halfSize, y: -halfSize },  // Top-right
        { x: halfSize, y: halfSize },   // Bottom-right
        { x: -halfSize, y: halfSize }   // Bottom-left
      ];

      // Rotate and position the robot corners
      // For CCW rotation where 0 = up (north)
      const rotatedCorners = corners.map(corner => {
        // Convert theta from degrees to radians for trigonometric functions
        const thetaRadians = theta * (Math.PI / 180);
        
        // Rotate the corner around robot center - using counterclockwise rotation formula
        const cosTheta = Math.cos(thetaRadians);
        const sinTheta = Math.sin(thetaRadians);

        const rotatedX = corner.x * cosTheta + corner.y * sinTheta;
        const rotatedY = -corner.x * sinTheta + corner.y * cosTheta;

        // Translate to robot position on canvas
        return {
          x: canvasPos.x + rotatedX,
          y: canvasPos.y + rotatedY
        };
      });

      // Draw robot body
      ctx.fillStyle = 'rgba(128, 128, 128, 0.7)';
      ctx.beginPath();
      ctx.moveTo(rotatedCorners[0].x, rotatedCorners[0].y);
      for (let i = 1; i < rotatedCorners.length; i++) {
        ctx.lineTo(rotatedCorners[i].x, rotatedCorners[i].y);
      }
      ctx.closePath();
      ctx.fill();

      // Draw robot outline
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(rotatedCorners[0].x, rotatedCorners[0].y);
      for (let i = 1; i < rotatedCorners.length; i++) {
        ctx.lineTo(rotatedCorners[i].x, rotatedCorners[i].y);
      }
      ctx.closePath();
      ctx.stroke();

      // Draw blue front face (0-1 side to be on top when the robot is at 0° orientation)
      ctx.strokeStyle = 'rgba(0, 102, 255, 1.0)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(rotatedCorners[0].x, rotatedCorners[0].y);
      ctx.lineTo(rotatedCorners[1].x, rotatedCorners[1].y);
      ctx.stroke();

      // Draw a small dot at the robot center for reference
      ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
      ctx.beginPath();
      ctx.arc(canvasPos.x, canvasPos.y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  // Handle image load
  useEffect(() => {
    const image = imageRef.current;
    if (!image) return;

    const handleImageLoad = () => {
      console.log("Field image loaded");
      setImageLoaded(true);
    };

    // Add event listener
    image.addEventListener('load', handleImageLoad);

    // If image is already loaded
    if (image.complete && image.naturalWidth) {
      handleImageLoad();
    }

    // Cleanup
    return () => {
      image.removeEventListener('load', handleImageLoad);
    };
  }, []);

  // Effect to handle resize events
  useEffect(() => {
    const container = containerRef.current;
    const image = imageRef.current;

    if (!container || !image) return;

    // Handle resize
    const handleResize = () => {
      console.log("Resize detected");
      if (canvasRef.current && latestDetections?.pose) {
        drawField(canvasRef.current, latestDetections.pose, latestDetections);
      }
    };

    // Create a ResizeObserver for better size change detection
    const resizeObserver = new ResizeObserver(() => {
      console.log("Container size changed");
      handleResize();
    });

    // Add resize listeners
    window.addEventListener('resize', handleResize);
    resizeObserver.observe(container);
    resizeObserver.observe(image);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
    };
  }, [latestDetections]);

  return (
    <div className="w-full h-full flex flex-col">
      <div className="bg-gray-100 p-2 border-b border-gray-200 text-sm font-medium text-gray-700">
        <span>VEX High Stakes Field</span>
      </div>
      <div className="flex-1 relative overflow-hidden bg-white" ref={containerRef}>
        {/* Field container - using a single centered container */}
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Image and canvas container with fixed aspect ratio */}
          <div className="relative w-full h-full">
            {/* Image element - ensure it's properly sized and centered */}
            <img
              ref={imageRef}
              src={"/vairc/field.png"}
              alt="VEX Field View"
              className={`absolute top-0 left-0 w-full h-full object-contain ${!imageLoaded ? 'opacity-0' : 'opacity-100'}`}
              loading="eager"
            />

            {/* Placeholder while image is loading */}
            {!imageLoaded && (
              <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                <div className="animate-pulse text-gray-500">Loading field view...</div>
              </div>
            )}

            {/* Canvas overlay perfectly aligned with image */}
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 w-full h-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FieldView;
