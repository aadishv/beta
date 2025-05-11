import React, { useRef, useCallback, useState } from "react";
import Modal from "react-modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { parseFormula, type ElementType } from "../types";

interface FormulaMassCalculatorProps {
  onClose: () => void;
  periodicData: ElementType[];
}

const calculateMass = (formula: string, periodicData: ElementType[]): string => {
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

const FormulaMassCalculator: React.FC<FormulaMassCalculatorProps> = ({
  onClose,
  periodicData,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [output, setOutput] = useState<string>("");

  const calculateAndDisplayMass = useCallback(() => {
    if (!inputRef.current) return;
    const formula = inputRef.current.value;
    if (!formula.trim()) {
      setOutput("");
      return;
    }
    try {
      const mass = calculateMass(formula, periodicData);
      setOutput(`${mass} g/mol`);
    } catch (error) {
      if (error instanceof Error) {
        setOutput(error.message);
      } else {
        setOutput("An unknown error occurred");
      }
    }
  }, [periodicData]);

  return (
    <div className="rounded bg-background p-6 max-w-md mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <Input
          ref={inputRef}
          type="text"
          placeholder="Type the chemical formula here"
          className="text-xl"
          onChange={calculateAndDisplayMass}
          autoFocus
        />
        <Button variant="outline" type="button" onClick={onClose}>
          Close
        </Button>
      </div>
      <div className="text-center font-mono text-xl min-h-[2em]">{output}</div>
    </div>
  );
};

interface FormulaMassModalProps {
  isOpen: boolean;
  onClose: () => void;
  periodicData: ElementType[];
}

export const FormulaMassModal: React.FC<FormulaMassModalProps> = ({
  isOpen,
  onClose,
  periodicData,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      shouldCloseOnOverlayClick
      shouldCloseOnEsc
      className="outline-none"
      overlayClassName="fixed inset-0 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]"
      ariaHideApp={false}
    >
      <FormulaMassCalculator onClose={onClose} periodicData={periodicData} />
    </Modal>
  );
};

export default FormulaMassCalculator;
