import React, { useRef, useState } from "react";
import Table from "./Table";
import SearchBar from "./components/SearchBar";
import { FormulaMassModal } from "./components/FormulaMassCalculator";
import ReferenceModal from "./components/ReferenceModal";
import type { ElementType } from "./types";
import elements from "./periodic.json";
import { Button } from "@/components/ui/button";

const App: React.FC = () => {
  // Map of refs for each element by atomic number
  const elementRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  // Modal state for formula mass calculator
  const [showMassModal, setShowMassModal] = useState(false);
  // Modal state for reference modal
  const [showReferenceModal, setShowReferenceModal] = useState(false);

  // Focus an element by atomic number
  const focusElementByNumber = (atomicNumber: number) => {
    const ref = elementRefs.current[atomicNumber];
    if (ref) {
      ref.focus();
    }
  };

  // Use the periodic data from JSON
  const periodicData = elements as ElementType[];

  return (
    <>
      <Table elementRefs={elementRefs} />
      <div className="fixed bottom-0 left-0 w-full bg-background border-t flex items-center gap-2 px-4 py-2 z-50" style={{ boxShadow: "0 -2px 8px rgba(0,0,0,0.03)" }}>
        <div className="flex-1">
          <SearchBar focusElementByNumber={focusElementByNumber} />
        </div>
        <div className="flex-1 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => setShowMassModal(true)}>
            Formula Mass Calculator
          </Button>
          <Button type="button" variant="outline" onClick={() => setShowReferenceModal(true)}>
            Reference
          </Button>
        </div>
      </div>
      <FormulaMassModal
        isOpen={showMassModal}
        onClose={() => setShowMassModal(false)}
        periodicData={periodicData}
      />
      <ReferenceModal
        isOpen={showReferenceModal}
        onClose={() => setShowReferenceModal(false)}
      />
    </>
  );
};

export default App;
