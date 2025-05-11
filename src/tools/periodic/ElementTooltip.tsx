import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import type { ElementType } from "./types";

type TooltipPlacement = "left" | "right";

interface ElementTooltipProps {
  el: ElementType;
  placement: TooltipPlacement;
  top: number;
  left: number;
  elemHeight: number;
  onClose: () => void;
}

const SQUARE_SIZE = 56; // px

const ElementTooltip: React.FC<ElementTooltipProps> = ({
  el,
  placement,
  top,
  left,
  elemHeight,
  onClose,
}) => {
  // Calculate vertical position and clamp so card never overflows viewport
  const CARD_WIDTH = SQUARE_SIZE * 4 * 1.5;

  return (
    <Card
      style={{
        width: CARD_WIDTH,
        top: 0,
        left:
          placement === "right"
            ? left + SQUARE_SIZE + 8
            : left - CARD_WIDTH - 8,
        pointerEvents: "auto",
      }}
      className="fixed z-50 h-[632px] mt-[16px] element-tooltip-card"
      onClick={e => e.stopPropagation()}
      tabIndex={-1}
      autoFocus
    >
      <CardHeader className="h-[120px] -mt-2">
        <p className="font-mono text-xs">PRESS SPACE TO SWITCH LAYOUT, ESC TO HIDE</p>
        <CardTitle>
          {el.name} <span className="text-base font-normal">({el.symbol})</span>
        </CardTitle>
        <CardDescription>
          Atomic Number: {el.number}
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[512px] overflow-y-auto">
        <div className="">
          <h6 className="underline decoration-wavy decoration-blue-500">Electron config</h6>
          <p>{el.electron_configuration_semantic || el.electron_configuration}</p>
        </div>
        <div className="">
          <h6 className="underline decoration-wavy decoration-blue-500">Full config</h6>
          <p>{el.electron_configuration}</p>
        </div>
        <div className="">
          <h6 className="underline decoration-wavy decoration-blue-500">Group</h6>
          <p>{(el as unknown as  {"group": string})["group"] ?? "N/A"}</p>
        </div>
        <div className="">
          <h6 className="underline decoration-wavy decoration-blue-500">Atomic mass</h6>
          <p>{el.atomic_mass.toFixed(2)}</p>
        </div>
        <div className="">
          <h6 className="underline decoration-wavy decoration-blue-500">Electronegativity</h6>
          <p>
            {el.electronegativity_pauling !== undefined && el.electronegativity_pauling !== null
              ? el.electronegativity_pauling
              : "N/A"}
          </p>
        </div>
        <div className="">
          <h6 className="underline decoration-wavy decoration-blue-500">Oxidation states</h6>
          <p>
            {Array.isArray(el.oxistates) && el.oxistates.length > 0
              ? el.oxistates.join(", ")
              : "N/A"}
          </p>
        </div>
        <div className="">
          <h6 className="underline decoration-wavy decoration-blue-500">Oxidation states (extended)</h6>
          <p>
            {Array.isArray(el.oxistates_extended) && el.oxistates_extended.length > 0
              ? el.oxistates_extended.join(", ")
              : "N/A"}
          </p>
        </div>
        <div className="">
          <h6 className="underline decoration-wavy decoration-blue-500">Fun fact</h6>
          <p>{el.fun_fact}</p>
        </div>
        <div className="mt-4">
          <a
            href={`https://www.google.com/search?q=${encodeURIComponent(el.name + " element")}`}
            target="_blank"
            tabIndex={1}
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Search on Google
          </a>
        </div>
      </CardContent>
    </Card>
  );
};

export default ElementTooltip;
