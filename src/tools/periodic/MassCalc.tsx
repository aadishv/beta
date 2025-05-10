// MassCalculator.tsx
import React, { useRef, useCallback } from "react";
import Modal from "react-modal";
import { parseFormula } from "./Utils";
import { Input } from "@/components/ui/input";

interface MassCalculatorProps {
  onClose: () => void;
  periodicData: any[]; // Replace with proper type
}

const calculateMass = (formula: string, periodicData: any[]): string => {
  const elementsFound = parseFormula(formula);
  let totalMass = 0;

  for (const [symbol, count] of Object.entries(elementsFound)) {
    const elementData = periodicData.find((e) => e.symbol === symbol);
    if (!elementData) {
      throw new Error(`Unknown element: ${symbol}`);
    }
    totalMass += elementData.atomic_mass * count;
  }
  return totalMass.toFixed(2);
};

const MassCalculator = ({ onClose, periodicData }: MassCalculatorProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  const calculateAndDisplayMass = useCallback(() => {
    if (!inputRef.current || !outputRef.current) return;

    const formula = inputRef.current.value;
    try {
      const mass = calculateMass(formula, periodicData);
      outputRef.current.innerText = `${mass} g/mol`;
    } catch (error) {
      if (error instanceof Error) {
        outputRef.current.innerText = error.message;
      } else {
        outputRef.current.innerText = "An unknown error occurred";
      }
    }
  }, [periodicData]);

  return (
    <div className="rounded bg-white">
      <div className="bg-stripes-header2 relative mx-auto max-w-md bg-opacity-100 p-6 pb-4">
        <div className="flex">
          <Input
            ref={inputRef}
            type="text"
            placeholder="Type the chemical formula here"
            onChange={calculateAndDisplayMass}
          />
        </div>
        <div
          ref={outputRef}
          className="m-2 mt-4 text-center"
        ></div>
      </div>
    </div>
  );
};

interface MassModalProps {
  isOpen: boolean;
  onClose: () => void;
  periodicData: any[]; // Replace with proper type
}

export const MassModal = ({
  isOpen,
  onClose,
  periodicData,
}: MassModalProps) => {
  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      shouldCloseOnOverlayClick
      shouldCloseOnEsc
      className="modal"
      overlayClassName="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4"
      ariaHideApp={false}
    >
      <MassCalculator onClose={onClose} periodicData={periodicData} />
    </Modal>
  );
};

export default MassCalculator;
