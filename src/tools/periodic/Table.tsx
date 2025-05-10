import React from "react";
import ElementComponent from "./Element";
import type { ElementType } from "./Utils";

interface PeriodicTableProps {
  pdata: ElementType[];
  onSetFocus: (elementNumber: number) => void;
  focusElement: number;
}

const PeriodicTable = ({ pdata, onSetFocus, focusElement }: PeriodicTableProps) => {
  const columns = 18;
  const rows = 10;

  return (
    <>
      {Array.from({ length: rows }, (_, rowIndex) => (
        <div key={rowIndex} className="flex flex-row">
          {Array.from({ length: columns }, (_, colIndex) => (
            <ElementComponent
              key={`${colIndex}-${rowIndex}`}
              x={colIndex + 1}
              y={rowIndex + 1}
              data={pdata}
              onFocusElement={onSetFocus}
              focusElement={focusElement}
            />
          ))}
        </div>
      ))}
    </>
  );
};

interface TableContentProps {
  focusElement: number;
  onSetFocusElement: (elementNumber: number) => void;
  periodicData: ElementType[];
}

export const TableContent = ({
  focusElement,
  onSetFocusElement,
  periodicData,
}: TableContentProps) => {
  return (
    <div className="flex">
      <div className="flex-grow overflow-x-auto p-4">
        <div className="min-w-max">
          <PeriodicTable pdata={periodicData} onSetFocus={onSetFocusElement} focusElement={focusElement} />
        </div>
      </div>
      <div className="flex-shrink-0">
        {/* Import and use DetailsView here to avoid circular dependencies */}
        {/* This would be replaced with the actual import in the real implementation */}
        <div id="details-placeholder"></div>
      </div>
    </div>
  );
};

export default PeriodicTable;
