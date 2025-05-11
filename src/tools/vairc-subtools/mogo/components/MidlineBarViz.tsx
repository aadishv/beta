import React from "react";

export type MidlineReading = { colorType: string; rgb: [number, number, number] };

export function MidlineBarViz({ readings }: { readings: MidlineReading[] }) {
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
        let border = "none";
        let opacity = 1;
        if (reading.colorType === "red") color = "#ef4444";
        if (reading.colorType === "blue") color = "#3b82f6";
        if (reading.colorType === "yellow") {
          color = "#FFFF00"; // BRIGHT YELLOW for visibility test
          border = "2px solid #bada55";
          opacity = 1;
        } else if (reading.colorType === "unknown") {
          color = "transparent";
          border = "none";
          opacity = 0.15;
        }
        return (
          <div
            key={i}
            style={{
              width: barWidth,
              height: barHeight,
              background: color,
              opacity,
              border,
              margin: 0,
              padding: 0,
              transition: "background 0.2s, opacity 0.2s, border 0.2s",
            }}
            title={reading.colorType}
          />
        );
      })}
    </div>
  );
}
