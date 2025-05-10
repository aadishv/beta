import React, { useRef, useEffect, useState, MouseEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MidlineBarViz } from "./components/MidlineBarViz";
import { SliceRectangles } from "./components/SliceRectangles";
import { colorDistance, median, robustColor, rgbToHsl, classifyColor, rgbToHex } from "./components/colorUtils";

type Point = { x: number; y: number };
type SliceDebug = { colorType: string; rgb: [number, number, number] };

const CANVAS_WIDTH = 640;
const CANVAS_HEIGHT = 360;
const NUM_SLICES = 6;

function pointInPoly(px: number, py: number, poly: [number, number][]) {
  let inside = false;
  for (let j = 0, k = poly.length - 1; j < poly.length; k = j++) {
    let xi = poly[j][0],
      yi = poly[j][1];
    let xj = poly[k][0],
      yj = poly[k][1];
    let intersect =
      yi > py !== yj > py &&
      px < ((xj - xi) * (py - yi)) / (yj - yi + 1e-10) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}



const sliceColorVars: Record<string, string> = {
  red: "var(--slice-red)",
  blue: "var(--slice-blue)",
  grey: "var(--slice-grey)",
  unknown: "var(--slice-unknown)",
};

const sliceColorLabels: Record<string, string> = {
  red: "Red",
  blue: "Blue",
  grey: "Grey",
  unknown: "Unknown",
};

function DebugSlices({ slices }: { slices: SliceDebug[] }) {
  return (
    <div style={{ display: "flex", gap: 12, marginTop: 0 }}>
      {slices.map((slice, i) => {
        const swatchColor =
          sliceColorVars[slice.colorType] || sliceColorVars.unknown;
        const label =
          sliceColorLabels[slice.colorType] || sliceColorLabels.unknown;
        const hex = rgbToHex(slice.rgb);
        return (
          <div
            key={i}
            style={{
              width: 60,
              height: 38,
              borderRadius: "0.5rem",
              border: "1.5px solid var(--muted)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.98rem",
              fontWeight: 500,
              letterSpacing: "-0.01em",
              boxShadow: "0 1px 2px 0 rgba(16, 30, 54, 0.04)",
              background: "#f1f5f9",
              position: "relative",
            }}
          >
            <div
              style={{
                width: 32,
                height: 16,
                borderRadius: "0.3rem",
                marginBottom: 2,
                border: "1px solid #e5e7eb",
                boxShadow: "0 1px 2px 0 rgba(16, 30, 54, 0.04)",
                background: swatchColor,
              }}
            />
            <div
              style={{
                fontSize: "0.92rem",
                fontWeight: 500,
                color: "#475569",
                marginTop: 1,
              }}
            >
              {label}
            </div>
            <div style={{ fontSize: "0.82rem", color: "#64748b" }}>{hex}</div>
          </div>
        );
      })}
    </div>
  );
}



export function App() {
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [points, setPoints] = useState<Point[]>([]);
  const [instructions, setInstructions] = useState(
    points.length === 2
      ? "Segment defined. Click Reset to pick new points."
      : "Click two points on the video to define the segment."
  );
  const [error, setError] = useState("");
  const [sliceDebug, setSliceDebug] = useState<SliceDebug[]>([]);
  const [videoSource, setVideoSource] = useState<HTMLImageElement | null>(null);
  const [redThreshold, setRedThreshold] = useState<number>(90);
  const [blueThreshold, setBlueThreshold] = useState<number>(90);
  const [yellowThreshold, setYellowThreshold] = useState<number>(24);
  const [midlineReadings, setMidlineReadings] = useState<MidlineReading[]>([]);

  // Always use MJPEG stream
  useEffect(() => {
    const img = imgRef.current!;
    setVideoSource(img);
  }, []);



  // Draw overlay and analyze slices, updating every frame for MJPEG
  useEffect(() => {
    let animationFrameId: number | null = null;
    let running = true;

    function drawOverlay() {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;

      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      setError("");
      let lastSliceDebug: SliceDebug[] = [];
      let allMidlineReadings: MidlineReading[] = [];

      if (points.length === 1) {
        ctx.fillStyle = "var(--slice-red)";
        ctx.beginPath();
        ctx.arc(points[0].x, points[0].y, 6, 0, 2 * Math.PI);
        ctx.fill();
      }
      if (points.length === 2) {
        let { x: x1, y: y1 } = points[0];
        let { x: x2, y: y2 } = points[1];

        ctx.fillStyle = "var(--slice-red)";
        ctx.beginPath();
        ctx.arc(x1, y1, 6, 0, 2 * Math.PI);
        ctx.arc(x2, y2, 6, 0, 2 * Math.PI);
        ctx.fill();

        let dx = x2 - x1;
        let dy = y2 - y1;
        let segLen = Math.sqrt(dx * dx + dy * dy);
        if (segLen > 1e-3 && videoSource) {
          let perp_dx = -dy / segLen;
          let perp_dy = dx / segLen;
          let rectWidth = (20 / 29) * segLen;
          let halfWidth = rectWidth / 2;

          // Get video frame pixels
          let tempCanvas = document.createElement("canvas");
          tempCanvas.width = CANVAS_WIDTH;
          tempCanvas.height = CANVAS_HEIGHT;
          let tempCtx = tempCanvas.getContext("2d")!;
          try {
            tempCtx.drawImage(
              videoSource,
              0,
              0,
              CANVAS_WIDTH,
              CANVAS_HEIGHT
            );
          } catch (e) {
            // If drawImage fails, fallback to transparent
          }
          let frame;
          try {
            frame = tempCtx.getImageData(
              0,
              0,
              CANVAS_WIDTH,
              CANVAS_HEIGHT
            );
          } catch (e) {
            // If getImageData fails, fallback to transparent
            frame = {
              data: new Uint8ClampedArray(
                CANVAS_WIDTH * CANVAS_HEIGHT * 4
              ),
            };
          }

          for (let i = 0; i < NUM_SLICES; ++i) {
            let t0 = i / NUM_SLICES;
            let t1 = (i + 1) / NUM_SLICES;

            let mx0 = x1 + dx * t0;
            let my0 = y1 + dy * t0;
            let mx1 = x1 + dx * t1;
            let my1 = y1 + dy * t1;

            let p1x = mx0 + perp_dx * halfWidth;
            let p1y = my0 + perp_dy * halfWidth;
            let p2x = mx1 + perp_dx * halfWidth;
            let p2y = my1 + perp_dy * halfWidth;
            let p3x = mx1 - perp_dx * halfWidth;
            let p3y = my1 - perp_dy * halfWidth;
            let p4x = mx0 - perp_dx * halfWidth;
            let p4y = my0 - perp_dy * halfWidth;

            // Sample pixels along the midline only
            let pixels: number[][] = [];
            const steps = Math.max(1, Math.round(Math.sqrt((mx1 - mx0) ** 2 + (my1 - my0) ** 2)));
            for (let s = 0; s <= steps; ++s) {
              const t = s / steps;
              const x = Math.round(mx0 + (mx1 - mx0) * t);
              const y = Math.round(my0 + (my1 - my0) * t);
              if (x >= 0 && x < CANVAS_WIDTH && y >= 0 && y < CANVAS_HEIGHT) {
                let idx = (y * CANVAS_WIDTH + x) * 4;
                let r = frame.data[idx],
                  g = frame.data[idx + 1],
                  b = frame.data[idx + 2];
                pixels.push([r, g, b]);
                // For the new visualization, classify each midline pixel individually
                const readingColorType = classifyColor([r, g, b], redThreshold, blueThreshold, yellowThreshold);
                allMidlineReadings.push({ colorType: readingColorType, rgb: [r, g, b] });
              }
            }
            let med = robustColor(pixels);
            let colorType = classifyColor(med, redThreshold, blueThreshold, yellowThreshold);

            lastSliceDebug.push({ colorType, rgb: med });

            // Draw midline for this slice
            ctx.save();
            ctx.strokeStyle = "#fff";
            ctx.lineWidth = 2.2;
            ctx.beginPath();
            ctx.moveTo(mx0, my0);
            ctx.lineTo(mx1, my1);
            ctx.stroke();
            ctx.restore();
          }
        }
      }
      setSliceDebug(lastSliceDebug);
      setMidlineReadings(allMidlineReadings);
      if (running && points.length === 2) {
        animationFrameId = requestAnimationFrame(drawOverlay);
      }
    }

    if (points.length === 2) {
      drawOverlay();
    } else {
      // If not defined, just draw once (for single point)
      drawOverlay();
    }

    return () => {
      running = false;
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [points, videoSource, redThreshold, blueThreshold]);



  // Handle canvas click
  function handleCanvasClick(e: MouseEvent<HTMLCanvasElement>) {
    if (points.length === 2) return;
    const rect = (
      e.target as HTMLCanvasElement
    ).getBoundingClientRect();
    const x = Math.round(
      ((e.clientX - rect.left) * CANVAS_WIDTH) / rect.width
    );
    const y = Math.round(
      ((e.clientY - rect.top) * CANVAS_HEIGHT) / rect.height
    );
    const newPoints = [...points, { x, y }];
    setPoints(newPoints);
    if (newPoints.length === 2) {
      setInstructions("Segment defined. Click Reset to pick new points.");
    } else {
      setInstructions("Click the second point on the video.");
    }
  }

  // Handle reset
  function handleReset() {
    setPoints([]);
    setInstructions("Click two points on the video to define the segment.");
  }

 // New horizontal, flipped, tall bar visualization at the top
 function MidlineBarViz({ readings }: { readings: MidlineReading[] }) {
   // Flip readings horizontally
   const flipped = [...readings].reverse();
   const barWidth = 4;
   const barHeight = 60;
   return (
     <div
       style={{
         width: flipped.length * barWidth,
         height: barHeight,
         display: "flex",
         flexDirection: "row",
         alignItems: "flex-end",
         justifyContent: "center",
         margin: "32px auto 0 auto",
         background: "#f8fafc",
         borderRadius: "0.5rem",
         boxShadow: "0 2px 8px 0 rgba(16, 30, 54, 0.06)",
         border: "1.5px solid #e5e7eb",
         overflow: "hidden",
       }}
     >
       {flipped.map((reading, i) => {
         let color = "transparent";
         if (reading.colorType === "red") color = "#ef4444";
         if (reading.colorType === "blue") color = "#3b82f6";
         return (
           <div
             key={i}
             style={{
               width: barWidth,
               height: barHeight,
               background: color,
               opacity: color === "transparent" ? 0.15 : 1,
               border: "none",
               margin: 0,
               padding: 0,
               transition: "background 0.2s, opacity 0.2s",
             }}
             title={reading.colorType}
           />
         );
       })}
     </div>
   );
 }

  // Debug: log colorTypes for midlineReadings
  console.log("midlineReadings colorTypes", midlineReadings.map(r => r.colorType));
  return (
    <div>
      <MidlineBarViz readings={midlineReadings} />
      <div
        style={{
          width: 700,
          margin: "40px auto",
          background: "#fff",
          borderRadius: "0.75rem",
          boxShadow: "0 4px 24px 0 rgba(16, 30, 54, 0.08)",
          padding: "32px 32px 24px 32px",
          border: "1px solid var(--border)",
        }}
      >
        <Card>
          <CardHeader>
          <h2
            style={{
              fontWeight: 600,
              fontSize: "1.5rem",
              margin: 0,
              marginBottom: 18,
              letterSpacing: "-0.01em",
            }}
          >
            Jetson Nano Camera Stream
          </h2>
        </CardHeader>
        <CardContent>
          <div
            id="stream-container"
            style={{
              width: CANVAS_WIDTH,
              height: CANVAS_HEIGHT,
              position: "relative",
              display: "block",
              borderRadius: "0.75rem",
              overflow: "hidden",
              border: "1px solid var(--muted)",
              background: "var(--muted)",
              marginBottom: 24,
              margin: 0,
              padding: 0,
              boxSizing: "content-box",
            }}
          >
            <img
              ref={imgRef}
              src="http://192.168.86.112:5000/video_feed"
              crossOrigin="anonymous"
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              draggable={false}
              alt="Camera Stream"
              style={{
                display: "",
                position: "absolute",
                left: 0,
                top: 0,
                width: CANVAS_WIDTH,
                height: CANVAS_HEIGHT,
                background: "#000",
                userSelect: "none",
                pointerEvents: "none",
                margin: 0,
                padding: 0,
                border: "none",
                boxSizing: "content-box",
              }}
            />
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: CANVAS_WIDTH,
                height: CANVAS_HEIGHT,
                pointerEvents: "auto",
                cursor: "crosshair",
                zIndex: 2,
                margin: 0,
                padding: 0,
                border: "none",
                boxSizing: "content-box",
              }}
              onClick={handleCanvasClick}
            />
          </div>
          <div
            id="controls"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 10,
              marginTop: 0,
            }}
          >
            <div
              id="instructions"
              style={{
                fontSize: "1.08rem",
                color: "var(--foreground)",
                marginBottom: 0,
                textAlign: "center",
                fontWeight: 500,
                letterSpacing: "-0.01em",
              }}
            >
              {instructions}
            </div>
            <Button
              id="reset-btn"
              type="button"
              onClick={handleReset}
              variant="outline"
            >
              Reset
            </Button>
            <div
              id="error-message"
              style={{
                color: "var(--danger)",
                fontSize: "1em",
                marginTop: 6,
                textAlign: "center",
                minHeight: "1.2em",
                fontWeight: 500,
                letterSpacing: "-0.01em",
              }}
            >
              {error}
            </div>
          </div>
          <div
             id="debug-view"
             style={{
               marginTop: 30,
               display: "flex",
               flexDirection: "column",
               alignItems: "center",
               gap: 6,
             }}
           >
             <SliceRectangles slices={sliceDebug} />
             <div style={{
               marginTop: 24,
               display: "flex",
               flexDirection: "column",
               alignItems: "center",
               width: "100%",
             }}>
               <label htmlFor="red-threshold-slider" style={{
                fontSize: "1.08rem",
                fontWeight: 500,
                color: "#ef4444",
                marginBottom: 6,
                letterSpacing: "-0.01em",
              }}>
                Red Threshold: <span style={{fontWeight:700}}>{redThreshold}</span>
              </label>
              <input
                id="red-threshold-slider"
                type="range"
                min={10}
                max={255}
                value={redThreshold}
                onChange={e => setRedThreshold(Number(e.target.value))}
                style={{
                  width: 320,
                  accentColor: "#ef4444",
                  marginBottom: 12,
                }}
              />
              <label htmlFor="blue-threshold-slider" style={{
                fontSize: "1.08rem",
                fontWeight: 500,
                color: "#3b82f6",
                marginBottom: 6,
                letterSpacing: "-0.01em",
              }}>
                Blue Threshold: <span style={{fontWeight:700}}>{blueThreshold}</span>
              </label>
              <input
                id="blue-threshold-slider"
                type="range"
                min={10}
                max={255}
                value={blueThreshold}
                onChange={e => setBlueThreshold(Number(e.target.value))}
                style={{
                  width: 320,
                  accentColor: "#3b82f6",
                  marginBottom: 12,
                }}
              />
              <label htmlFor="yellow-threshold-slider" style={{
                fontSize: "1.08rem",
                fontWeight: 500,
                color: "#3A491E",
                marginBottom: 6,
                letterSpacing: "-0.01em",
              }}>
                Yellow Threshold: <span style={{fontWeight:700}}>{yellowThreshold}</span>
              </label>
              <input
                id="yellow-threshold-slider"
                type="range"
                min={10}
                max={90}
                value={yellowThreshold}
                onChange={e => setYellowThreshold(Number(e.target.value))}
                style={{
                  width: 320,
                  accentColor: "#3A491E",
                  marginBottom: 0,
                }}
              />
            </div>
             <div style={{
               marginTop: 24,
               display: "flex",
               flexDirection: "column",
               alignItems: "center",
               width: "100%",
             }}>
               <div style={{
                 fontSize: "1.08rem",
                 fontWeight: 500,
                 color: "#475569",
                 marginBottom: 6,
                 letterSpacing: "-0.01em",
               }}>
                 Slice Types
               </div>
               <div style={{
                 display: "flex",
                 flexDirection: "row",
                 gap: 18,
                 justifyContent: "center",
                 alignItems: "center",
               }}>
                 {sliceDebug.map((slice, i) => {
                   // Calculate hue and distances for display
                   const [hue, , ] = rgbToHsl(slice.rgb);
                   const normHue = ((hue % 360) + 360) % 360;
                   const distRed = Math.round(Math.min(Math.abs(normHue - 0), 360 - Math.abs(normHue - 0)));
                   const distBlue = Math.round(Math.min(Math.abs(normHue - 240), 360 - Math.abs(normHue - 240)));
                   return (
                     <div key={i} style={{
                       fontSize: "1.02rem",
                       fontWeight: 600,
                       color:
                         slice.colorType === "red"
                           ? "#ef4444"
                           : slice.colorType === "blue"
                           ? "#3b82f6"
                           : slice.colorType === "yellow"
                           ? "#3A491E"
                           : "#64748b",
                       background: "#f1f5f9",
                       borderRadius: 8,
                       padding: "4px 14px",
                       border: "1.5px solid #cbd5e1",
                       minWidth: 60,
                       textAlign: "center",
                       display: "flex",
                       flexDirection: "column",
                       alignItems: "center",
                     }}>
                       <span>
                         {slice.colorType.charAt(0).toUpperCase() + slice.colorType.slice(1)}
                       </span>
                       <span style={{ fontSize: "0.92em", color: "#64748b", fontWeight: 400 }}>
                         RGB: [{slice.rgb.map(v => Math.round(v)).join(", ")}]
                       </span>
                       <span style={{ fontSize: "0.92em", color: "#64748b", fontWeight: 400 }}>
                         Hue: {Math.round(normHue)}
                       </span>
                       <span style={{ fontSize: "0.92em", color: "#64748b", fontWeight: 400 }}>
                         dRed: {distRed}, dBlue: {distBlue}
                       </span>
                     </div>
                   );
                 })}
               </div>
               {/* Debug: Show yellow pixel count and first few midline pixel hues/saturations */}
               <div style={{
                 marginTop: 18,
                 fontSize: "1.02rem",
                 color: "#3A491E",
                 fontWeight: 500,
                 background: "#f8fafc",
                 borderRadius: 8,
                 padding: "6px 18px",
                 border: "1.5px solid #e5e7eb",
                 display: "inline-block"
               }}>
                 {(() => {
                   const yellowCount = midlineReadings.filter(r => r.colorType === "yellow").length;
                   return (
                     <>
                       Yellow pixels in top bar: <b>{yellowCount}</b>
                       <br />
                       {midlineReadings.slice(0, 8).map((r, i) => {
                         const [h, s, l] = rgbToHsl(r.rgb);
                         return (
                           <span key={i} style={{marginRight: 10, fontSize: "0.95em", color: r.colorType === "yellow" ? "#3A491E" : "#64748b"}}>
                             #{i}: H={Math.round(h)}, S={s.toFixed(2)}, {r.colorType}
                           </span>
                         );
                       })}
                     </>
                   );
                 })()}
               </div>
             </div>
           </div>
         </CardContent>
      </Card>
    </div>
    </div>

  );
}

export default App;
