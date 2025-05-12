import React, { useState } from "react";
import { useSelector } from "@xstate/store/react";
import Modal from "react-modal";
import { TrafficLights } from "../Review";
import { store } from "../Store";

type MyModalProps = {
  modalIsOpen: boolean;
  closeModal: () => void;
  relativeTimes: {
    character: Record<string, string>;
    pinyin: Record<string, string>;
  };
  history: {
    character: Record<string, [number, string]>;
    pinyin: Record<string, [number, string]>;
  };
};

function Button({
  name,
  onClick,
  red = false,
}: {
  name: string;
  onClick: () => void;
  red?: boolean;
}) {
  return (
    <button
      className={`m-0 h-8 justify-center truncate p-0 font-lora underline transition-all duration-300 ease-in-out ${
        red ? "hover:decoration-red-600" : "hover:decoration-header"
      } ${red ? "decoration-red-400" : "decoration-header2"}`}
      onClick={onClick}
    >
      {name}
    </button>
  );
}

const MyModal: React.FC<MyModalProps> = ({
  modalIsOpen,
  closeModal,
  relativeTimes,
  history,
}) => {
  const [activeTab, setActiveTab] = useState<"character" | "pinyin">("character");
  const numSentences = useSelector(
    store,
    (state) => state.context.sentences.length,
  );
  // Determine which data to use based on active tab
  const currentHistory = history[activeTab] || {};

  return (
    <Modal
      isOpen={modalIsOpen}
      onRequestClose={closeModal}
      contentLabel="History Modal"
      className="m-auto w-3/4 max-w-lg bg-white font-lora"
      overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
      ariaHideApp={false}
    >
      <div className="bg-stripes-header2 h-full w-full p-6">
        <h2 className="mb-4 text-xl font-bold">Learning history</h2>
        <p className="">You have {numSentences} sentences left this cycle.</p>
        {/* Tabs for switching between character and pinyin history */}
        <div className="mb-4 flex border-b border-header">
          <button
            className={`mr-4 px-2 py-1 font-medium ${
              activeTab === "character"
                ? "border-b-2 border-header text-header"
                : "text-gray-500"
            }`}
            onClick={() => setActiveTab("character")}
          >
            Characters
          </button>
          <button
            className={`px-2 py-1 font-medium ${
              activeTab === "pinyin"
                ? "border-b-2 border-header text-header"
                : "text-gray-500"
            }`}
            onClick={() => setActiveTab("pinyin")}
          >
            Pinyin
          </button>
        </div>

        <div className="mb-4">
          {!Object.keys(currentHistory).length ? (
            <p>
              Your {activeTab} learning history will appear here. It is
              currently empty.
            </p>
          ) : (
            <div className="list-disc">
              {Object.entries(currentHistory).map(([key, value]) => (
                <div key={key} className="flex">
                  <span className="w-20 font-lora text-xl font-bold">
                    {key}
                  </span>
                  <span className="my-auto px-4">
                    <TrafficLights state={value[0]} checkMark={false} />
                  </span>
                  <span className="my-auto px-4 font-mono text-gray-500">
                    {relativeTimes[activeTab][key]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex justify-between">
          <div className="px-4 py-2">
            <Button
              name="Clear Data"
              red
              onClick={() => {
                if (
                  confirm(
                    "Are you sure you want to delete all data from past practice sessions?",
                  )
                ) {
                  // Get existing data
                  const storedData = JSON.parse(
                    localStorage.getItem("chinese_app_data") || "{}",
                  );
                  // Clear only current mode data
                  if (storedData) {
                    // storedData[CURRENT_MODE] = {};
                    localStorage.setItem(
                      "chinese_app_data",
                      JSON.stringify(storedData),
                    );
                  }
                  window.location.reload();
                }
              }}
            />
          </div>
          <div className="px-4 py-2">
            <Button name="Close" onClick={closeModal} />
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default MyModal;
