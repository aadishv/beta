import React from "react";

type SliceDebug = { colorType: string; rgb: [number, number, number] };

// New visualization: rounded rectangles for each slice
export function SliceRectangles({ slices }: { slices: SliceDebug[] }) {
  // Background image size (scaled up by 5x)
  const SCALE = 5;
  const IMG_WIDTH = 210 * SCALE;
  const IMG_HEIGHT = 60 * SCALE;
  // Rectangles collectively are 0.8x image width/height
  const totalRectWidth = IMG_WIDTH * 0.8;
  const totalRectHeight = IMG_HEIGHT * 0.8;
  const rectCount = slices.length;
  const rectHeight = totalRectHeight / rectCount;
  const rectWidth = rectHeight * 3.5; // 7/2 aspect ratio

  return (
    <div
      style={{
        position: "relative",
        width: IMG_WIDTH,
        height: IMG_HEIGHT,
        marginTop: 18,
        marginBottom: 0,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <img
        src="/vairc/mogo_straight.png"
        alt=""
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: IMG_WIDTH,
          height: IMG_HEIGHT,
          objectFit: "contain",
          zIndex: 0,
          pointerEvents: "none",
          userSelect: "none",
        }}
        draggable={false}
      />
      <div
        style={{
          position: "absolute",
          left: (IMG_WIDTH - rectWidth) / 2,
          top: (IMG_HEIGHT - totalRectHeight) / 2,
          width: rectWidth,
          height: totalRectHeight,
          display: "flex",
          flexDirection: "column",
          gap: 0,
          zIndex: 1,
        }}
      >
        {slices.map((slice, i) => {
          let color = "transparent";
          if (slice.colorType === "red") {
            color = "#ef4444";
          } else if (slice.colorType === "blue") {
            color = "#3b82f6";
          } // all others remain transparent
          return (
            <div
              key={i}
              style={{
                width: rectWidth,
                height: rectHeight,
                borderRadius: 999,
                background: color,
                border: color === "transparent" ? "1.5px dashed #cbd5e1" : "1.5px solid #cbd5e1",
                opacity: color === "transparent" ? 0.3 : 1,
                transition: "background 0.2s, border 0.2s, opacity 0.2s",
                boxShadow: color !== "transparent" ? "0 1px 4px 0 rgba(16, 30, 54, 0.08)" : "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: 0,
              }}
              title={slice.colorType.charAt(0).toUpperCase() + slice.colorType.slice(1)}
            />
          );
        })}
      </div>
    </div>
  );
}
