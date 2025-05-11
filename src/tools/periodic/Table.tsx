import React, { useState, useRef, useEffect } from "react";
import { type ElementType } from "./types";
import originalElements from "./periodic.json";
import ElementSquare from "./ElementSquare";
import ElementTooltip from "./ElementTooltip";


const elements = originalElements as ElementType[];
// Find the max xpos and ypos for grid sizing
const maxX = Math.max(...elements.map((el: ElementType) => el.xpos));
const maxY = Math.max(...elements.map((el: ElementType) => el.ypos));

const SQUARE_SIZE = 56; // px, adjust as needed

type TableProps = {
  elementRefs: React.MutableRefObject<{ [key: number]: HTMLDivElement | null }>;
};

const Table: React.FC<TableProps> = ({ elementRefs }) => {
  const [tooltip, setTooltip] = useState<{
    el: ElementType;
    placement: "left" | "right";
    top: number;
    left: number;
    elemHeight: number;
  } | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Focus the first element (atomic number 1) on mount
    if (elementRefs.current[1]) {
      elementRefs.current[1].focus();
    }
  }, [elementRefs]);

  const handleElementClick = (
    e: React.MouseEvent<HTMLDivElement> | React.FocusEvent<HTMLDivElement>,
    el: ElementType
  ) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const spaceLeft = rect.left;
    const spaceRight = window.innerWidth - rect.right;
    let placement: "left" | "right" = spaceRight >= spaceLeft ? "right" : "left";

    // Use viewport coordinates for fixed positioning
    const top = rect.top;
    const left = rect.left;
    const elemHeight = rect.height;

    setTooltip({ el, placement, top, left, elemHeight });
  };

  const handleCloseTooltip = () => setTooltip(null);

  // Prevent tooltip from closing if focus moves into the tooltip
  const handleElementBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    const nextFocused = e.relatedTarget as HTMLElement | null;
    if (nextFocused && nextFocused.closest('.element-tooltip-card')) {
      // Focus is moving into the tooltip, don't close it
      return;
    }
    setTooltip(null);
  };

  const handleElementKeyDown = (e: React.KeyboardEvent<HTMLDivElement>, el: ElementType) => {
    if (e.key === "Escape") {
      setTooltip(null);
      if (gridRef.current) gridRef.current.focus();
    }
    // Switch card position with spacebar if tooltip is open and focused
    if (e.key === " " && tooltip && tooltip.el.number === el.number) {
      e.preventDefault();
      setTooltip(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          placement: prev.placement === "right" ? "left" : "right"
        };
      });
    }
  };

  return (
    <>
      <div
        className="relative"
        ref={gridRef}
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${maxX}, minmax(${SQUARE_SIZE}px, 1fr))`,
          gridTemplateRows: `repeat(${maxY}, minmax(${SQUARE_SIZE}px, 1fr))`,
          gap: "8px",
          width: maxX * (SQUARE_SIZE + 8),
          margin: 16,
        }}
        onClick={() => {
          if (tooltip) handleCloseTooltip();
        }}
      >
        {elements.map((el: ElementType) => (
          <ElementSquare
            key={el.symbol}
            el={el}
            tabIndex={el.number}
            elementRef={ref => { elementRefs.current[el.number] = ref; }}
            onClick={handleElementClick}
            onFocus={handleElementClick}
            onBlur={handleElementBlur}
            onKeyDown={e => handleElementKeyDown(e, el)}
          />
        ))}
        {tooltip &&
          <ElementTooltip
            el={tooltip.el}
            placement={tooltip.placement}
            top={tooltip.top}
            left={tooltip.left}
            elemHeight={tooltip.elemHeight}
            onClose={handleCloseTooltip}
          />
        }
      </div>
    </>
  );
};
export default Table;
