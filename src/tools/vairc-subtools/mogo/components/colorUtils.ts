// Color utility functions for Mogo tools

export function colorDistance(rgb: number[], ref: number[]) {
  return Math.sqrt(
    Math.pow(rgb[0] - ref[0], 2) +
      Math.pow(rgb[1] - ref[1], 2) +
      Math.pow(rgb[2] - ref[2], 2)
  );
}

export function median(arr: number[]) {
  arr = arr.slice().sort((a, b) => a - b);
  const mid = Math.floor(arr.length / 2);
  return arr.length % 2 !== 0
    ? arr[mid]
    : (arr[mid - 1] + arr[mid]) / 2;
}

export function robustColor(pixels: number[][]): [number, number, number] {
  if (pixels.length === 0) return [127, 127, 127];
  let rs = pixels.map((p) => p[0]);
  let gs = pixels.map((p) => p[1]);
  let bs = pixels.map((p) => p[2]);
  return [median(rs), median(gs), median(bs)] as [number, number, number];
}

export function rgbToHsl([r, g, b]: number[]): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)); break;
      case g: h = ((b - r) / d + 2); break;
      case b: h = ((r - g) / d + 4); break;
    }
    h *= 60;
  }
  return [h, s, l];
}

export function classifyColor(
  rgb: number[],
  redThreshold: number,
  blueThreshold: number,
  yellowThreshold: number
) {
  const [hue, s, l] = rgbToHsl(rgb);
  // Normalize hue to [0,360)
  const normHue = ((hue % 360) + 360) % 360;
  const redHue = 0;
  const blueHue = 240;
  const yellowHue = 80; // #3A491E
  const distToRed = Math.min(Math.abs(normHue - redHue), 360 - Math.abs(normHue - redHue));
  const distToBlue = Math.min(Math.abs(normHue - blueHue), 360 - Math.abs(normHue - blueHue));
  const distToYellow = Math.min(Math.abs(normHue - yellowHue), 360 - Math.abs(normHue - yellowHue));
  // Filter out grayscale (low saturation)
  if (s < 0.2) {
    return "unknown";
  }
  if (distToRed < redThreshold) {
    return "red";
  } else if (distToBlue < blueThreshold) {
    return "blue";
  } else if (distToYellow < yellowThreshold) {
    console.log("YELLOW CLASSIFIED", { rgb, hue, s, l, distToYellow, yellowThreshold });
    return "yellow";
  } else {
    return "unknown";
  }
}

export function rgbToHex(rgb: number[]) {
  return (
    "#" +
    rgb
      .map((x) => {
        let h = Math.round(x).toString(16);
        return h.length === 1 ? "0" + h : h;
      })
      .join("")
  );
}
