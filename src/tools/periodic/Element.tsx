import React, { memo } from "react";
import {
  type ElementType,
  type ElementTypeString,
  TEXT_COLORS,
  getGradientStyle,
} from "./Utils";

interface ElementComponentProps {
  x: number;
  y: number;
  data: ElementType[];
  onFocusElement: (elementNumber: number) => void;
  focusElement: number;
}

// Element Component (memoized for performance)
const ElementComponent = memo(
  ({ x, y, data, onFocusElement, focusElement }: ElementComponentProps) => {
    if (!Array.isArray(data)) return null;
    const element = data.find((item) => item.xpos === x && item.ypos === y);
    const elementType = element?.type || "";
    const gradientStyle = getGradientStyle(elementType);

    return (
      <div
        tabIndex={element?.number ?? -1}
        id={`element-${element ? element.number : ""}`}
        className={`m-1 aspect-square h-16 w-16 text-2xl rounded-md focus-visible:outline-none transition-colors duration-200 ${
          element?.number === focusElement
            ? "ring-2 ring-offset-2 ring-[color:var(--ring-color)]"
            : ""
        }`}
        style={{
          background: gradientStyle,
          color: TEXT_COLORS[elementType as ElementTypeString],
          // fallback for custom color ring
          ...(element?.number === focusElement
            ? { "--ring-color": TEXT_COLORS[elementType as ElementTypeString] }
            : {}),
        }}
        onFocus={() => element && onFocusElement(element.number)}
      >
        <div className="flex flex-grow justify-start px-1">
          {element?.number ?? ""}
        </div>
        <div className="flex flex-grow justify-end px-1">
          {element?.symbol ?? ""}
        </div>
      </div>
    );
  },
);
ElementComponent.displayName = "ElementComponent";

export default ElementComponent;
