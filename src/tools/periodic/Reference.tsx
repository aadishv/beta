import React, { useState, useMemo } from "react";
import Modal from "react-modal";
import { Button } from "@/components/ui/button";

interface ReferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TabInfo {
  name: string;
  imageSrc: string;
  alt: string;
}

const ReferenceModal = ({ isOpen, onClose }: ReferenceModalProps) => {
  const [activeTab, setActiveTab] = useState<number>(0);
  const tabs = useMemo<TabInfo[]>(
    () => [
      {
        name: "Aufbau Principle",
        imageSrc: "/chemutils/aufbau.jpg",
        alt: "Aufbau Principle",
      },
      {
        name: "Bonding",
        imageSrc: "/chemutils/bonding.avif",
        alt: "Chemical Bonding",
      },
      {
        name: "Solubility",
        imageSrc: "/chemutils/solubility.webp",
        alt: "Solubility Rules",
      },
      {
        name: "Transition metal charges",
        imageSrc: "/chemutils/transition_charges.avif",
        alt: "Common transition metal charges",
      },
    ],
    [],
  );

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
      <div className="rounded-lg bg-white">
        <div
          className="bg-stripes-header2 rounded-lg p-6"
          style={{ width: "80vw", height: "80vh", maxWidth: "1200px" }}
        >
          <div className="mb-4 flex">
            {tabs.map((tab, index) => (
              <Button
                key={tab.name}
                variant={activeTab === index ? "outline" : "ghost"}
                className="mr-4 h-8 px-2 text-xl"
                onClick={() => setActiveTab(index)}
              >
                {tab.name}
              </Button>
            ))}
          </div>
          <div className="h-[calc(80vh-140px)] overflow-auto">
            <img
              src={tabs[activeTab].imageSrc}
              alt={tabs[activeTab].alt}
              className="max-h-full max-w-full object-contain"
            />
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ReferenceModal;