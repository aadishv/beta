import React from "react";
import { useState, useEffect, useCallback, useRef } from "react";
import Confetti from "react-confetti";
import useWindowSize from "react-use/lib/useWindowSize";

// --- Constants ---
const GRID_SIZE = 4;
const TILE_COUNT = GRID_SIZE * GRID_SIZE;
const EMPTY_INDEX = TILE_COUNT - 1; // Represents the empty space (index 15)
const TILE_DIMENSION_VW = 15; // Visual dimension of each tile in vw
const BOARD_DIMENSION_VW = TILE_DIMENSION_VW * GRID_SIZE; // Board size in vw
const CENTER_TILES = [6, 7, 10, 11]; // Numbers of the center tiles

// --- Default Image URL Placeholder ---
const DEFAULT_IMAGE_URL = "https://i.imgur.com/y2h8wno.png";
const PLACEHOLDER_DEFAULT_URL = "https://aadishv.github.io/s.jpeg"; // Store placeholder value for comparison

// --- Helper Functions ---

// Function to generate the solved state (numbers 1 to 15, null at end)
const generateSolvedTiles = () =>
  Array.from({ length: TILE_COUNT }, (_, i) =>
    i === EMPTY_INDEX ? null : i + 1,
  );

// Function to check if the puzzle is solved
const isSolved = (tiles) => {
  for (let i = 0; i < EMPTY_INDEX; i++) {
    if (tiles[i] !== i + 1) return false;
  }
  return tiles[EMPTY_INDEX] === null;
};

// Function to format time in milliseconds to MM:SS.ss
const formatTime = (milliseconds) => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const hundredths = Math.floor((milliseconds % 1000) / 10); // Get hundredths
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(hundredths).padStart(2, "0")}`;
};

// Function to get row and column from index
const getCoords = (index) => ({
  row: Math.floor(index / GRID_SIZE),
  col: index % GRID_SIZE,
});

// Function to get index from row and column
const getIndex = (row, col) => row * GRID_SIZE + col;

// Function to swap two elements in an array
const swap = (arr, i, j) => {
  const newArr = [...arr];
  [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  return newArr;
};

// Function to calculate delay for shuffle animation (slow-fast-slow)
const calculateShuffleDelay = (step, totalSteps) => {
  const minDelay = 5; // Fastest delay (ms) in the middle
  const maxDelay = 50; // Slowest delay (ms) at start/end - Further Reduced
  const progress = step / totalSteps; // 0 to 1
  // Use a parabolic function: 4 * (x - 0.5)^2 gives 1 at ends, 0 in middle
  const parabola = 4 * Math.pow(progress - 0.5, 2);
  const delay = minDelay + (maxDelay - minDelay) * parabola;
  return Math.max(minDelay, delay); // Ensure delay doesn't go below minDelay
};

// --- Main App Component ---
function App() {
  // --- State ---
  const [tiles, setTiles] = useState(generateSolvedTiles()); // Logical state (numbers 1-15, null)
  const [moves, setMoves] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0); // Timer state in milliseconds
  const [timerActive, setTimerActive] = useState(false); // Timer active state
  const [solved, setSolved] = useState(true); // Track solved state
  const [originalImageSrc, setOriginalImageSrc] = useState(null); // Store the uploaded or default image source
  const [tileImages, setTileImages] = useState([]); // Store dataURLs for each image tile piece
  const [isLoadingImage, setIsLoadingImage] = useState(false); // Loading indicator
  const [showResetConfirm, setShowResetConfirm] = useState(false); // State for reset confirmation
  const fileInputRef = useRef(null); // Ref for the file input
  const [animationDirection, setAnimationDirection] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false); // State for fullscreen status
  const [isShuffling, setIsShuffling] = useState(false); // State for shuffle animation
  const appContainerRef = useRef(null); // Ref for the main component container
  const { width, height } = useWindowSize(); // Get window dimensions for confetti

  // --- Derived State ---
  const emptyIndex = tiles.indexOf(null); // Find the index of the empty tile
  const { row: emptyRow, col: emptyCol } = getCoords(emptyIndex);

  // --- Shuffling Logic --- (Defined before processImage as it's called by it)
  const shuffleBoard = useCallback(
    async (forceShuffle = false) => {
      // Added async
      if (isLoadingImage || isShuffling) return; // Prevent shuffle if loading or already shuffling
      if (!originalImageSrc && !forceShuffle) return;

      setIsShuffling(true); // Start shuffling animation
      setMoves(0);
      setTimeElapsed(0); // Reset timer
      setTimerActive(false); // Stop timer
      setSolved(false); // Board is not solved during shuffle

      let currentTiles = generateSolvedTiles();
      let currentEmptyIndex = EMPTY_INDEX;
      const shuffleMoves = 300; // Total number of shuffle steps - Increased

      setTiles(currentTiles); // Show solved state briefly before starting

      // Short initial delay before animation starts
      await new Promise((resolve) => setTimeout(resolve, 100));

      for (let i = 0; i < shuffleMoves; i++) {
        const { row: currentEmptyRow, col: currentEmptyCol } =
          getCoords(currentEmptyIndex);
        const possibleMoves = [];
        // Find valid neighboring tiles to swap with the empty space
        if (currentEmptyRow > 0)
          possibleMoves.push(getIndex(currentEmptyRow - 1, currentEmptyCol));
        if (currentEmptyRow < GRID_SIZE - 1)
          possibleMoves.push(getIndex(currentEmptyRow + 1, currentEmptyCol));
        if (currentEmptyCol > 0)
          possibleMoves.push(getIndex(currentEmptyRow, currentEmptyCol - 1));
        if (currentEmptyCol < GRID_SIZE - 1)
          possibleMoves.push(getIndex(currentEmptyRow, currentEmptyCol + 1));

        // Choose a random valid move
        const randomIndex = Math.floor(Math.random() * possibleMoves.length);
        const tileToMoveIndex = possibleMoves[randomIndex];

        // Perform the swap
        currentTiles = swap(currentTiles, currentEmptyIndex, tileToMoveIndex);
        currentEmptyIndex = tileToMoveIndex; // Update the empty index

        // Update the state to show the move
        setTiles(currentTiles);

        // Calculate and wait for the delay
        const delay = calculateShuffleDelay(i, shuffleMoves);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      // Ensure final state is consistent
      setSolved(isSolved(currentTiles)); // Check if somehow solved (unlikely)
      setIsShuffling(false); // End shuffling animation
    },
    [originalImageSrc, isLoadingImage, isShuffling], // Add isShuffling dependency
  ); // Recreate if dependencies change

  // --- Image Processing Logic ---
  const processImage = useCallback(
    (imageSrc) => {
      if (isLoadingImage || !imageSrc) {
        if (!imageSrc)
          console.warn("Invalid image source provided for processing.");
        return;
      }
      if (imageSrc === PLACEHOLDER_DEFAULT_URL) {
        console.warn("Placeholder URL detected, cannot process.");
        if (!originalImageSrc) {
          shuffleBoard(true);
        }
        return;
      }

      setIsLoadingImage(true);
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.src = imageSrc;

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const pieceWidth = img.width / GRID_SIZE;
        const pieceHeight = img.height / GRID_SIZE;
        canvas.width = pieceWidth;
        canvas.height = pieceHeight;
        const ctx = canvas.getContext("2d");
        const newTileImages = [];

        try {
          for (let i = 0; i < EMPTY_INDEX; i++) {
            const tileValue = i + 1;
            const solvedIndex = i;
            const { row, col } = getCoords(solvedIndex);

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(
              img,
              col * pieceWidth,
              row * pieceHeight,
              pieceWidth,
              pieceHeight,
              0,
              0,
              canvas.width,
              canvas.height,
            );
            newTileImages[tileValue - 1] = canvas.toDataURL();
          }

          setTileImages(newTileImages);
          setOriginalImageSrc(imageSrc);
          setIsLoadingImage(false);
          shuffleBoard(true);
        } catch (error) {
          console.error(
            "Error processing image with canvas (potentially CORS issue):",
            error,
          );
          alert(
            "Error processing image. It might be due to Cross-Origin (CORS) restrictions on the image server. Try uploading the image directly or use a different URL.",
          );
          setIsLoadingImage(false);
          if (imageSrc === DEFAULT_IMAGE_URL && !originalImageSrc) {
            shuffleBoard(true);
          }
        }
      };

      img.onerror = (error) => {
        console.error("Error loading image source:", imageSrc, error);
        alert(
          "Error loading the image. Please check the URL or file. If using a URL, ensure it's accessible and allows cross-origin requests.",
        );
        setIsLoadingImage(false);
        if (imageSrc === DEFAULT_IMAGE_URL && !originalImageSrc) {
          shuffleBoard(true);
        }
      };
    },
    [isLoadingImage, originalImageSrc, shuffleBoard],
  );

  // --- Image Upload Handler ---
  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (file && !isLoadingImage) {
      const reader = new FileReader();
      reader.onload = (e) => {
        processImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // --- Initial Load Effect ---
  useEffect(() => {
    if (DEFAULT_IMAGE_URL) {
      processImage(DEFAULT_IMAGE_URL);
    } else {
      shuffleBoard(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Tile Click Logic ---
  const handleTileClick = (clickedIndex) => {
    // Disable clicks during shuffle animation
    if (solved || isLoadingImage || isShuffling || clickedIndex === emptyIndex)
      return;

    const { row: clickedRow, col: clickedCol } = getCoords(clickedIndex);
    let direction = null;
    let slideIndices = [];

    if (clickedRow === emptyRow) {
      // Horizontal move potential
      direction = clickedCol < emptyCol ? "right" : "left";
      const startCol = Math.min(clickedCol, emptyCol);
      const endCol = Math.max(clickedCol, emptyCol);
      for (let c = startCol; c <= endCol; c++)
        slideIndices.push(getIndex(clickedRow, c));
    } else if (clickedCol === emptyCol) {
      // Vertical move potential
      direction = clickedRow < emptyRow ? "down" : "up";
      const startRow = Math.min(clickedRow, emptyRow);
      const endRow = Math.max(clickedRow, emptyRow);
      for (let r = startRow; r <= endRow; r++)
        slideIndices.push(getIndex(r, clickedCol));
    } else {
      return; // Invalid move (not same row/col)
    }

    if (slideIndices.length === 0 || !slideIndices.includes(clickedIndex)) {
      console.warn("Invalid move calculation prevented.");
      return;
    }

    // --- Perform the slide ---
    let newTiles = [...tiles];
    const emptyValue = null;

    if (direction === "right") {
      // Empty moves right
      setAnimationDirection("right");
      for (let i = slideIndices.length - 1; i > 0; i--)
        newTiles[slideIndices[i]] = newTiles[slideIndices[i - 1]];
      newTiles[slideIndices[0]] = emptyValue;
    } else if (direction === "left") {
      // Empty moves left
      setAnimationDirection("left");
      for (let i = 0; i < slideIndices.length - 1; i++)
        newTiles[slideIndices[i]] = newTiles[slideIndices[i + 1]];
      newTiles[slideIndices[slideIndices.length - 1]] = emptyValue;
    } else if (direction === "down") {
      // Empty moves down
      setAnimationDirection("down");
      for (let i = slideIndices.length - 1; i > 0; i--)
        newTiles[slideIndices[i]] = newTiles[slideIndices[i - 1]];
      newTiles[slideIndices[0]] = emptyValue;
    } else if (direction === "up") {
      // Empty moves up
      setAnimationDirection("up");
      for (let i = 0; i < slideIndices.length - 1; i++)
        newTiles[slideIndices[i]] = newTiles[slideIndices[i + 1]];
      newTiles[slideIndices[slideIndices.length - 1]] = emptyValue;
    }

    const newSolvedState = isSolved(newTiles);

    setTiles(newTiles);
    setMoves(moves + 1);
    setSolved(newSolvedState);

    // Start timer on first move
    if (moves === 0 && !timerActive) {
      setTimerActive(true);
    }

    // Stop timer if solved
    if (newSolvedState) {
      setTimerActive(false);
    }

    setTimeout(() => {
      setAnimationDirection(null);
    }, 300);
  };

  // --- Fullscreen Logic ---
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      appContainerRef.current?.requestFullscreen().catch((err) => {
        alert(
          `Error attempting to enable full-screen mode: ${err.message} (${err.name})`,
        );
      });
    } else {
      document.exitFullscreen();
    }
  };

  // Effect to listen for fullscreen changes (e.g., ESC key)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    // Cleanup listener on component unmount
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []); // Empty dependency array ensures this runs only once on mount

  // --- Timer Effect ---
  useEffect(() => {
    let interval = null;
    const intervalDuration = 10; // Update every 10ms for hundredths
    if (timerActive) {
      interval = setInterval(() => {
        // Increment by the interval duration
        setTimeElapsed((prevTime) => prevTime + intervalDuration);
      }, intervalDuration);
    } else if (!timerActive && timeElapsed !== 0) {
      // Timer stopped but has a value, clear interval
      clearInterval(interval);
    }
    return () => clearInterval(interval); // Cleanup interval on unmount or timer stop
  }, [timerActive, timeElapsed]); // Rerun effect if timerActive changes

  // --- Rendering with Periodic Table Styling ---
  return (
    // Add ref and conditional background for fullscreen
    <div
      ref={appContainerRef}
      className={`flex min-h-screen flex-col items-center justify-center p-4 font-mono ${isFullscreen ? "bg-white dark:bg-gray-900" : ""}`} // Add background in fullscreen
    >
      {/* Conditionally render confetti when solved */}
      {solved && (
        <Confetti
          width={width}
          height={height}
          recycle={false} // Stop confetti after a bit
          numberOfPieces={300} // Adjust number of pieces
          gravity={0.3} // Adjust gravity
        />
      )}
      {/* Controls Row styled like periodic table controls */}
      <div className="flex" style={{ margin: "2vw" }}>
        {/* Search bar styled component replacement */}
        <div className="flex-grow">
          <div className="flex items-center">
            <label className="m-0 mr-4 h-8 border-b-2 border-header2 p-0 font-lora text-xl hover:border-header">
              <span className="cursor-pointer">Upload Image</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </label>
          </div>
        </div>

        {/* Game stats */}
        <div className="mr-4 flex items-end space-x-4">
          {" "}
          {/* Added space-x-4 */}
          <span className="m-0 h-8 border-b-2 border-header2 p-0 font-lora text-xl">
            Moves: {moves}
          </span>
          <span className="m-0 h-8 border-b-2 border-header2 p-0 font-lora text-xl">
            Time: {formatTime(timeElapsed)}
          </span>
        </div>

        {/* Reset/shuffle button, confirmation, or shuffling indicator */}
        <div className="flex h-8 items-end">
          {" "}
          {/* Ensure consistent height */}
          {isShuffling ? (
            <span className="m-0 border-b-2 border-header2 p-0 font-lora text-xl text-gray-500">
              Shuffling...
            </span>
          ) : !showResetConfirm ? (
            <button
              onClick={() => setShowResetConfirm(true)} // Show confirmation on click
              className="m-0 h-8 border-b-2 border-header2 p-0 font-lora text-xl hover:border-header disabled:cursor-not-allowed disabled:opacity-50" // Added disabled styles
              disabled={isLoadingImage} // Only disable if loading, shuffling handled above
            >
              Reset / Shuffle
            </button>
          ) : (
            <div className="flex items-center space-x-2 rounded bg-yellow-100 p-1">
              <span className="text-sm text-yellow-800">Are you sure?</span>
              <button
                onClick={() => {
                  shuffleBoard(true); // This is now async, but we don't need to await it here
                  setShowResetConfirm(false); // Hide confirmation after action
                }}
                className="rounded bg-red-500 px-2 py-0.5 text-sm text-white hover:bg-red-600"
              >
                Confirm
              </button>
              <button
                onClick={() => setShowResetConfirm(false)} // Hide confirmation on cancel
                className="rounded bg-gray-300 px-2 py-0.5 text-sm hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Fullscreen button */}
        <div className="ml-4 flex items-end">
          <button
            onClick={toggleFullscreen}
            className="m-0 h-8 border-b-2 border-header2 p-0 font-lora text-xl hover:border-header"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          </button>
        </div>
      </div>

      {/* Game Board Area - Keep it similar but with periodic table card styling */}
      <div className="flex">
        <div className="flex-grow overflow-x-auto p-4">
          <div className="min-w-max">
            <div
              className="relative overflow-hidden rounded-lg border-2 border-header2 shadow-lg"
              style={{
                // Use vh in fullscreen for better scaling, keep vw otherwise
                width: isFullscreen ? `calc(90vh)` : `${BOARD_DIMENSION_VW}vw`,
                height: isFullscreen ? `calc(90vh)` : `${BOARD_DIMENSION_VW}vw`,
                maxWidth: "90vw", // Prevent excessive width on wide screens in fullscreen
                maxHeight: "90vh", // Ensure it fits vertically
                background: `repeating-linear-gradient(45deg, #F3E7FE 0px, #F3E7FE 2px, white 2px, white 5px)`,
              }}
            >
              {/* Absolutely Positioned Tiles Container - Keep the original styling */}
              <div className="absolute inset-0">
                {tiles.map((tileValue, currentVisualIndex) => {
                  const { row, col } = getCoords(currentVisualIndex);
                  const isEmpty = tileValue === null;
                  const tileHasImage =
                    originalImageSrc && tileImages[tileValue - 1];
                  const isCenterTile = CENTER_TILES.includes(tileValue);

                  // Calculate visual position as percentage
                  const visualTopPercent = row * (100 / GRID_SIZE);
                  const visualLeftPercent = col * (100 / GRID_SIZE);

                  let bgClass = "";
                  // Keep border for visual separation, it will act as the minimal gap
                  if (isEmpty) {
                    bgClass = "bg-transparent border-none shadow-none";
                  } else if (tileHasImage) {
                    bgClass = "bg-transparent border-gray-500"; // Keep border for image tiles
                  } else if (isCenterTile) {
                    bgClass = "bg-green-500 hover:bg-green-600 border-gray-500"; // Green for center numbers
                  } else {
                    bgClass = "bg-blue-400 hover:bg-blue-500 border-gray-500"; // Blue for other numbers
                  }

                  // Style for the tile piece
                  const tileStyle = {
                    // Set size to exactly fill the grid cell percentage
                    width: `calc(${100 / GRID_SIZE}%)`,
                    height: `calc(${100 / GRID_SIZE}%)`,
                    // Position precisely at the percentage offset (no extra gap pixels)
                    top: `calc(${visualTopPercent}%)`,
                    left: `calc(${visualLeftPercent}%)`,
                    transform: `translateZ(0)`, // Promote layer for smoother animation
                    // Use CSS transition for smooth movement of top/left properties
                    transition: "top 0.3s ease-in-out, left 0.3s ease-in-out",
                    visibility: (isEmpty ? "hidden" : "visible") as
                      | "hidden"
                      | "visible",
                    backgroundImage: tileHasImage
                      ? `url(${tileImages[tileValue - 1]})`
                      : "none",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  };

                  return (
                    <div
                      key={currentVisualIndex}
                      className={`/* Ensure is included in size */ absolute box-border flex select-none items-center justify-center rounded border font-bold shadow-sm ${!isEmpty || isShuffling ? "cursor-default" : "cursor-pointer"} ${!tileHasImage && !isEmpty ? "text-xl text-white" : ""} ${bgClass} `} // Change cursor if shuffling
                      style={tileStyle}
                      onClick={() => handleTileClick(currentVisualIndex)} // Click handler already checks isShuffling
                    >
                      {!tileHasImage && !isEmpty && tileValue}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
