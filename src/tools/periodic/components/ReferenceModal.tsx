import React, { useState } from "react";
import Modal from "react-modal";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface ReferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const tabData = [
  {
    name: "Aufbau Principle",
    imageSrc: "/chemutils/aufbau.jpg",
    alt: "Aufbau Principle",
    value: "aufbau",
  },
  {
    name: "Bonding",
    imageSrc: "/chemutils/bonding.avif",
    alt: "Chemical Bonding",
    value: "bonding",
  },
  {
    name: "Solubility",
    imageSrc: "/chemutils/solubility.webp",
    alt: "Solubility Rules",
    value: "solubility",
  },
  {
    name: "Transition metal charges",
    imageSrc: "/chemutils/transition_charges.avif",
    alt: "Common transition metal charges",
    value: "transition",
  },
  {
    name: "Metal activity series",
    imageSrc: "/chemutils/activity_series.avif",
    alt: "Willingness of metals to ionize",
    value: "activity",
  },
];

const ReferenceModal: React.FC<ReferenceModalProps> = ({ isOpen, onClose }) => {
  const [tab, setTab] = useState(tabData[0].value);

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
      <div className="rounded-lg bg-background shadow-lg w-[80vw] h-[80vh] max-w-[1200px] flex flex-col">
        <Tabs value={tab} onValueChange={setTab} className="flex flex-col h-full">
          {/* Header for TabsList and Close Button */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4">
            <TabsList>
              {tabData.map((t) => (
                <TabsTrigger key={t.value} value={t.value}>
                  {t.name}
                </TabsTrigger>
              ))}
            </TabsList>
            <Button variant="outline" size="sm" onClick={onClose} className="ml-4 flex-shrink-0">
              Close
            </Button>
          </div>

          {/* Content Area */}
          {tabData.map((t) => (
            <TabsContent key={t.value} value={t.value} className="flex-1 mt-0 overflow-y-auto">
              {/* Inner div for padding and centering content */}
              <div className="flex items-center justify-center w-full h-full p-4">
                <img
                  src={t.imageSrc}
                  alt={t.alt}
                  className="max-h-full max-w-full object-contain rounded"
                  draggable={false}
                />
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </Modal>
  );
};

export default ReferenceModal;
