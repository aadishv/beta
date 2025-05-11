import React from "react";
import { BG_COLORS, TEXT_COLORS, type ElementType } from "./types";

const SQUARE_SIZE = 56; // px, adjust as needed
const PADDING = 6; // px

type ElementSquareProps = {
  el: ElementType;
  tabIndex: number;
  elementRef: (ref: HTMLDivElement | null) => void;
  onClick: (e: React.MouseEvent<HTMLDivElement>, el: ElementType) => void;
  onFocus: (e: React.FocusEvent<HTMLDivElement>, el: ElementType) => void;
  onBlur: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void;
};

const ElementSquare: React.FC<ElementSquareProps> = ({
  el,
  tabIndex,
  elementRef,
  onClick,
  onFocus,
  onBlur,
  onKeyDown,
}) => (
  <div
    key={el.symbol}
    tabIndex={0}
    aria-label={el.name}
    ref={elementRef}
    style={{
      gridColumn: el.xpos,
      gridRow: el.ypos,
      cursor: "pointer",
      position: "relative",
      zIndex: 1,
      outline: "none",
      borderRadius: 12,
    } as React.CSSProperties}
    className="focus:ring-2 ring-black ring-ring"
    onClick={e => {
      e.stopPropagation();
      onClick(e, el);
    }}
    onFocus={e => {
      e.stopPropagation();
      onFocus(e, el);
    }}
    onBlur={onBlur}
    onKeyDown={onKeyDown}
  >
    <div
      className="rounded-xl flex flex-col justify-between h-full w-full"
      style={{
        background: BG_COLORS[el.type],
        height: SQUARE_SIZE,
        width: SQUARE_SIZE,
        padding: PADDING,
      }}
    >
      <span
        className="font-mono"
        style={{
          color: TEXT_COLORS[el.type],
          fontSize: SQUARE_SIZE * 0.36,
          textAlign: "left",
          lineHeight: 1,
          fontWeight: 350,
          whiteSpace: "nowrap",
        }}
      >
        {el.number}
      </span>
      <span
        className="font-serif"
        style={{
          color: TEXT_COLORS[el.type],
          fontSize: SQUARE_SIZE * 0.36,
          textAlign: "right",
          lineHeight: 1,
          fontWeight: "normal",
          whiteSpace: "nowrap",
        }}
      >
        {el.symbol}
      </span>
    </div>
  </div>
);

export default ElementSquare;
