import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const GRID_SIZE = 4;
const TILE_COUNT = GRID_SIZE * GRID_SIZE;
const EMPTY_INDEX = TILE_COUNT - 1;
const DEFAULT_IMAGE_URL = "https://i.imgur.com/y2h8wno.png";

function generateSolvedTiles() {
  return Array.from({ length: TILE_COUNT }, (_, i) =>
    i === EMPTY_INDEX ? null : i + 1
  );
}

function isSolved(tiles: (number | null)[]) {
  for (let i = 0; i < EMPTY_INDEX; i++) {
    if (tiles[i] !== i + 1) return false;
  }
  return tiles[EMPTY_INDEX] === null;
}

function formatTime(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const hundredths = Math.floor((ms % 1000) / 10);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0"
  )}.${String(hundredths).padStart(2, "0")}`;
}

function getCoords(index: number) {
  return { row: Math.floor(index / GRID_SIZE), col: index % GRID_SIZE };
}

function getIndex(row: number, col: number) {
  return row * GRID_SIZE + col;
}

function swap(arr: (number | null)[], i: number, j: number) {
  const newArr = [...arr];
  [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  return newArr;
}

export default function Slide() {
  const [tiles, setTiles] = useState<(number | null)[]>(generateSolvedTiles());
  const [moves, setMoves] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [solved, setSolved] = useState(true);
  const [isShuffling, setIsShuffling] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tileImages, setTileImages] = useState<string[]>([]);
  const [tileRects, setTileRects] = useState<{x: number, y: number, width: number, height: number}[]>([]);
  const [imgDims, setImgDims] = useState<{width: number, height: number} | null>(null);

  // Timer effect
  useEffect(() => {
    if (!timerActive) return;
    const interval = setInterval(() => {
      setTimeElapsed((t) => t + 10);
    }, 10);
    return () => clearInterval(interval);
  }, [timerActive]);

  // Shuffle logic
  const shuffleBoard = useCallback(() => {
    setIsShuffling(true);
    setMoves(0);
    setTimeElapsed(0);
    setTimerActive(false);
    setSolved(false);

    let currentTiles = generateSolvedTiles();
    let emptyIdx = EMPTY_INDEX;
    const movesCount = 200;

    for (let i = 0; i < movesCount; i++) {
      const { row, col } = getCoords(emptyIdx);
      const possible: number[] = [];
      if (row > 0) possible.push(getIndex(row - 1, col));
      if (row < GRID_SIZE - 1) possible.push(getIndex(row + 1, col));
      if (col > 0) possible.push(getIndex(row, col - 1));
      if (col < GRID_SIZE - 1) possible.push(getIndex(row, col + 1));
      const swapIdx = possible[Math.floor(Math.random() * possible.length)];
      currentTiles = swap(currentTiles, emptyIdx, swapIdx);
      emptyIdx = swapIdx;
    }
    setTiles(currentTiles);
    setIsShuffling(false);
  }, []);

  // Tile click logic
  function handleTileClick(idx: number) {
    if (isShuffling || solved) return;
    const emptyIdx = tiles.indexOf(null);
    const { row: er, col: ec } = getCoords(emptyIdx);
    const { row: tr, col: tc } = getCoords(idx);

    // Only allow if in same row or column and not already the empty tile
    if ((er === tr || ec === tc) && idx !== emptyIdx) {
      let newTiles = [...tiles];
      if (er === tr) {
        // Same row: slide horizontally
        const start = Math.min(ec, tc);
        const end = Math.max(ec, tc);
        if (ec < tc) {
          // Move left to right
          for (let c = ec; c < tc; c++) {
            newTiles[getIndex(er, c)] = newTiles[getIndex(er, c + 1)];
          }
        } else {
          // Move right to left
          for (let c = ec; c > tc; c--) {
            newTiles[getIndex(er, c)] = newTiles[getIndex(er, c - 1)];
          }
        }
        newTiles[getIndex(er, tc)] = null;
      } else if (ec === tc) {
        // Same column: slide vertically
        const start = Math.min(er, tr);
        const end = Math.max(er, tr);
        if (er < tr) {
          // Move top to bottom
          for (let r = er; r < tr; r++) {
            newTiles[getIndex(r, ec)] = newTiles[getIndex(r + 1, ec)];
          }
        } else {
          // Move bottom to top
          for (let r = er; r > tr; r--) {
            newTiles[getIndex(r, ec)] = newTiles[getIndex(r - 1, ec)];
          }
        }
        newTiles[getIndex(tr, ec)] = null;
      }
      setTiles(newTiles);
      setMoves((m) => m + 1);
      if (!timerActive) setTimerActive(true);
      if (isSolved(newTiles)) {
        setSolved(true);
        setTimerActive(false);
      }
    }
  }

  // Reset/shuffle
  function handleReset() {
    setShowConfirm(false);
    shuffleBoard();
  }

  // File input (image upload) - not implemented, placeholder for extensibility
  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (fileInputRef.current) fileInputRef.current.value = "";
    // Placeholder: no-op
  }

  // On mount: slice the default image into tile images, then shuffle
  useEffect(() => {
    function getTileRects(imgWidth: number, imgHeight: number) {
      const rects = [];
      let y = 0;
      for (let row = 0; row < GRID_SIZE; row++) {
        let x = 0;
        const isLastRow = row === GRID_SIZE - 1;
        const remainingRows = GRID_SIZE - row;
        const tileHeight = isLastRow
          ? imgHeight - y
          : Math.round((imgHeight - y) / remainingRows);
        for (let col = 0; col < GRID_SIZE; col++) {
          const isLastCol = col === GRID_SIZE - 1;
          const remainingCols = GRID_SIZE - col;
          const tileWidth = isLastCol
            ? imgWidth - x
            : Math.round((imgWidth - x) / remainingCols);
          rects.push({ x, y, width: tileWidth, height: tileHeight });
          x += tileWidth;
        }
        y += tileHeight;
      }
      return rects;
    }

    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.src = DEFAULT_IMAGE_URL;
    img.onload = () => {
      const rects = getTileRects(img.width, img.height);
      setTileRects(rects);
      setImgDims({ width: img.width, height: img.height });
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const images: string[] = [];
      for (let i = 0; i < TILE_COUNT - 1; i++) {
        const { x, y, width, height } = rects[i];
        canvas.width = width;
        canvas.height = height;
        ctx!.clearRect(0, 0, width, height);
        ctx!.drawImage(
          img,
          x,
          y,
          width,
          height,
          0,
          0,
          width,
          height
        );
        images[i] = canvas.toDataURL();
      }
      setTileImages(images);
      shuffleBoard();
    };
    // eslint-disable-next-line
  }, []);

  return (
    <div className="flex flex-row items-center justify-center min-h-screen gap-16 bg-background">
      <style>
        {`
          .puzzle-tile-anim {
            transition: left 0.12s cubic-bezier(0.4,0,0.2,1), top 0.12s cubic-bezier(0.4,0,0.2,1);
            will-change: left, top;
          }
        `}
      </style>
      <div
        className="relative rounded-xl"
        style={{
          width: imgDims?.width,
          height: imgDims?.height,
          minWidth: imgDims?.width,
          minHeight: imgDims?.height,
        }}
      >
        {Array.from({ length: TILE_COUNT - 1 }).map((_, tileValue) => {
          const idx = tiles.indexOf(tileValue + 1);
          const rect = tileRects[idx];
          if (!rect) return null;
          return (
            <Button
              key={tileValue + 1}
              className="absolute p-0 puzzle-tile-anim"
              style={{
                left: rect.x,
                top: rect.y,
                width: rect.width,
                height: rect.height,
                background: tileImages[tileValue]
                  ? `url(${tileImages[tileValue]})`
                  : "transparent",
                backgroundSize: "cover",
                backgroundPosition: "center",
                opacity: 0.95,
              }}
              onClick={() => handleTileClick(idx)}
              disabled={isShuffling || solved}
              tabIndex={-1}
            />
          );
        })}
      </div>
      <div className="flex flex-col items-stretch">
        <div className="w-full" style={{ minWidth: 340, width: 340 }}>
          <div className="rounded-xl border bg-card p-8 flex flex-col gap-8 items-center" style={{ minWidth: 300, width: "100%" }}>
            <div className="flex flex-col gap-8 w-full">
              <div className="flex flex-col gap-4 w-full">
                <span className="text-3xl font-bold">Moves: {moves}</span>
                <span className="text-3xl font-bold">Time: {formatTime(timeElapsed)}</span>
              </div>
              <div className="flex gap-2 w-full">
                <Button
                  variant="outline"
                  size="lg"
                  className="flex-1 text-lg py-4"
                  onClick={() => setShowConfirm(true)}
                  disabled={isShuffling}
                >
                  Reset / Shuffle
                </Button>
              </div>
              {showConfirm && (
                <div className="flex flex-col gap-2 items-center w-full">
                  <span className="text-base">Are you sure?</span>
                  <div className="flex gap-2 w-full">
                    <Button
                      variant="outline"
                      size="lg"
                      className="flex-1 text-lg py-4"
                      onClick={handleReset}
                      disabled={isShuffling}
                    >
                      Yes
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      className="flex-1 text-lg py-4"
                      onClick={() => setShowConfirm(false)}
                    >
                      No
                    </Button>
                  </div>
                </div>
              )}
            </div>
            {solved && (
              <div className="text-green-600 font-semibold text-2xl text-center mt-4">
                🎉 Puzzle Solved!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
