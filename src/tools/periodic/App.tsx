// App.tsx
import React, { useState, useRef, useCallback, useEffect } from "react";
import Fuse from "fuse.js";
import Modal from "react-modal";
import PERIODIC_DATA from "@/tools/periodic.js";
import DetailsView from "./Details";
import { TableContent } from "./Table";
import { Controls } from "./Controls";
import ReferenceModal from "./Reference";
import { MassModal } from "./MassCalc";
import type { ElementType } from "./Utils";

// Initialize Fuse search
const fuseOptions = {
  keys: [
    { name: "name", weight: 0.7 },
    { name: "symbol", weight: 0.3 },
    { name: "number", weight: 0.1 },
  ],
};
const fuse = new Fuse(PERIODIC_DATA, fuseOptions);

export default function PeriodicTableApp() {
  const initialRandomElement =
    1 + Math.floor(Math.random() * PERIODIC_DATA.length);
  const [focusElement, setFocusElement] =
    useState<number>(initialRandomElement);
  const [showMassModal, setShowMassModal] = useState<boolean>(false);
  const [showReferenceModal, setShowReferenceModal] = useState<boolean>(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleGlobalKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && (e.key === "f" || e.key === "k")) {
      e.preventDefault();
      searchInputRef.current?.focus();
    }
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => {
      document.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, [handleGlobalKeyDown]);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const target = e.target as HTMLFormElement;
    const query = (target.elements[0] as HTMLInputElement).value
      .trim()
      .toLowerCase();
    const results = fuse.search(query);
    if (results.length > 0) {
      const element = results[0].item as ElementType;
      const el = document.getElementById(`element-${element.number}`);
      if (el) {
        el.focus();
      }
    }
  }, []);

  const handleRandomClick = useCallback(() => {
    const randomElement = 1 + Math.floor(Math.random() * PERIODIC_DATA.length);
    setFocusElement(randomElement);
  }, []);

  // Check if current date is April 16 or 17, 2025
  const isDisabledDate = useCallback(() => {
    const today = new Date();
    const month = today.getMonth(); // 0-based index (April = 3)
    const day = today.getDate();
    const year = today.getFullYear();

    return year === 2025 && month === 3 && (day === 16 || day === 17);
  }, []);

  const handleMassModalToggle = useCallback(() => {
    setShowMassModal((prev) => !prev);
  }, []);

  const handleReferenceModalOpen = useCallback(() => {
    setShowReferenceModal(true);
  }, []);

  return (
    <>
      <Controls
        searchInputRef={searchInputRef}
        handleSearch={handleSearch}
        handleRandomClick={handleRandomClick}
        handleReferenceModalOpen={handleReferenceModalOpen}
        handleMassModalToggle={handleMassModalToggle}
        isDisabled={isDisabledDate()}
      />

      <MassModal
        isOpen={showMassModal}
        onClose={() => setShowMassModal(false)}
        periodicData={PERIODIC_DATA}
      />

      <ReferenceModal
        isOpen={showReferenceModal}
        onClose={() => setShowReferenceModal(false)}
      />

      <div className="flex">
        <div className="flex-grow overflow-x-auto p-4">
          <div className="min-w-max">
            <TableContent
              focusElement={focusElement}
              onSetFocusElement={setFocusElement}
              periodicData={PERIODIC_DATA}
              focusElement={focusElement}
            />
          </div>
        </div>
        <div className="flex-shrink-0">
          <DetailsView
            elementNumber={focusElement}
            periodicData={PERIODIC_DATA}
          />
        </div>
      </div>
    </>
  );
}
