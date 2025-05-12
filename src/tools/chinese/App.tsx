import { useEffect, useMemo, useRef, useState } from "react";
import { CharState, type Sentence } from "./Data";
import { useSelector } from "@xstate/store/react";
import { Review, TrafficLights } from "./Review";
import { store, type AppMode, getAllLessons } from "./Store";
import Modal from "react-modal";
import RelativeTime from "@yaireo/relative-time";
/**
 * Simple button component that renders a clickable button with underline decoration
 * @param {string} name - The text to display on the button
 * @param {() => void} onClick - Click handler function
 */
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
      className={`m-0 h-8 justify-center truncate p-0 font-lora underline transition-all duration-300 ease-in-out ${red ? "hover:decoration-red-600" : "hover:decoration-header"} ${red ? "decoration-red-400" : "decoration-header2"}`}
      onClick={onClick}
    >
      {name}
    </button>
  );
}

/**
 * Basic sentence details with click-to-reveal English meaning
 */
function SentenceDetails() {
  const [revealMeaning, setRevealMeaning] = useState(false);
  const sentence: Sentence = useSelector(
    store,
    (state) => state.context.sentences[0],
  );

  return (
    <div className="bg-stripes-header2 flex w-[50rem] gap-1 rounded-xl border border-header py-3">
      <span className="my-auto w-[20rem] border-r border-r-header px-5 font-lora text-xl">
        <span className="text-transform font-caps font-mono text-sm uppercase text-header">
          lesson
        </span>
        <br />
        {sentence.lesson}
      </span>
      <span
        className={`group my-auto w-[30rem] ${!revealMeaning ? "cursor-pointer" : ""} px-5 font-lora text-xl`}
        onClick={() => setRevealMeaning(true)}
      >
        <span className="text-transform font-caps font-mono text-sm uppercase text-header">
          english meaning{" "}
          {!revealMeaning && (
            <span className="text-xs italic">(click to reveal)</span>
          )}
        </span>
        <br />
        {revealMeaning ? (
          <span className="opacity-100 transition-opacity duration-500">
            {sentence.def}
          </span>
        ) : (
          <div
            className="group relative flex items-center gap-1"
            title="English hidden for a little extra challenge, click to reveal it"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-6 w-6 text-gray-400 transition-colors group-hover:text-header"
            >
              <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
              <path
                fillRule="evenodd"
                d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        )}
      </span>
      <span className="mt-auto px-3 font-mono text-base text-gray-500">
        {sentence.id}
      </span>
    </div>
  );
}

/**
 * Component that renders a full sentence review interface with multiple characters
 */
function SentenceReview({ mode }: { mode: AppMode | null }) {
  const id = useRef({
    id: Math.random().toString(36).substring(2, 10) + Date.now().toString(36),
    m: mode ?? ((Math.random() < 0.5 ? "character" : "pinyin") as AppMode),
  }).current;

  // Move session update to useEffect
  useEffect(() => {
    store.trigger.updateSession({ key: id.id, date: new Date() });
  }, []);

  const sentences = useSelector(store, (state) => state.context.sentences);

  return (
    <div className="flex w-full flex-wrap justify-center gap-4 overflow-visible">
      {sentences[0].words.map(
        (word: { character: string; pinyin: string }, index: number) => {
          // Special handling for punctuation - display inline with previous character
          const isPunctuation = word.pinyin === "";
          const previousIsPunctuation =
            index > 0 && sentences[0].words[index - 1].pinyin === "";

          // Create a non-breaking span for punctuation to keep it with preceding characters
          return (
            <div
              key={index}
              className={
                isPunctuation
                  ? "-ml-2 inline-block whitespace-nowrap"
                  : undefined
              }
              style={isPunctuation ? { position: "relative" } : undefined}
            >
              <Review
                character={word.character}
                pinyin={word.pinyin}
                persistentId={id.id}
                mode={id.m}
              />
            </div>
          );
        },
      )}
    </div>
  );
}

function Footer({
  showModal,
  showSettingsModal,
  progressSentence, // (skips if not done)
}: {
  showModal: () => void;
  showSettingsModal: () => void;
  progressSentence: () => void;
}) {
  return (
    <div className="flex w-full">
      <div className="mb-0 mr-auto flex flex-row gap-5">
        <Button
          name="help"
          onClick={() => {
            window.location.href = "/blog/using-chinese";
          }}
        />
        <Button name="history" onClick={() => showModal()} />
        <Button name="settings" onClick={() => showSettingsModal()} />
      </div>
      <div className="mb-0 ml-auto flex flex-row gap-5">
        <Button
          name="continue"
          onClick={() => {
            progressSentence();
          }}
        />
      </div>
    </div>
  );
}

function MyModal({ modalIsOpen, closeModal, relativeTimes, history }) {
  const [activeTab, setActiveTab] = useState("character");
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
            className={`mr-4 px-2 py-1 font-medium ${activeTab === "character" ? "border-b-2 border-header text-header" : "text-gray-500"}`}
            onClick={() => setActiveTab("character")}
          >
            Characters
          </button>
          <button
            className={`px-2 py-1 font-medium ${activeTab === "pinyin" ? "border-b-2 border-header text-header" : "text-gray-500"}`}
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
}

function SettingsModal({
  modalIsOpen,
  closeModal,
  currentMode,
  setMode,
}: {
  modalIsOpen: boolean;
  closeModal: () => void;
  currentMode: AppMode | null;
  setMode: (mode: AppMode | null) => void;
}) {
  // Update settings immediately when changed
  const updateMode = (newMode: AppMode | null) => {
    setMode(newMode);
  };

  // State for lesson selection
  const allLessons = useMemo(() => getAllLessons(), []);
  const enabledLessons = useSelector(
    store,
    (state) => state.context.enabledLessons,
  );
  const [selectedLessons, setSelectedLessons] =
    useState<string[]>(enabledLessons);

  // Handle the selection/deselection of a lesson
  const toggleLesson = (lesson: string) => {
    setSelectedLessons((prev) =>
      prev.includes(lesson)
        ? prev.filter((l) => l !== lesson)
        : [...prev, lesson],
    );
  };

  // Handle select all / deselect all
  const toggleAllLessons = () => {
    if (selectedLessons.length === allLessons.length) {
      setSelectedLessons([]);
    } else {
      setSelectedLessons([...allLessons]);
    }
  };

  // Apply lesson selection changes
  useEffect(() => {
    // If no lessons are selected, select all (default behavior)
    const lessonsToApply =
      selectedLessons.length === 0 ? allLessons : selectedLessons;

    // Update the store with enabled lessons
    store.trigger.updateEnabledLessons({ enabledLessons: lessonsToApply });
  }, [selectedLessons, allLessons]);

  return (
    <Modal
      isOpen={modalIsOpen}
      onRequestClose={closeModal}
      contentLabel="Settings Modal"
      className="m-auto w-3/4 max-w-lg bg-white font-lora"
      overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
      ariaHideApp={false}
    >
      <div className="bg-stripes-header2 h-full w-full p-6">
        <h2 className="mb-4 text-xl font-bold">Settings</h2>

        <div className="mb-6">
          <h3 className="mb-2 font-medium">Practice Mode</h3>
          <div className="flex flex-col gap-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="mode"
                checked={currentMode === null}
                onChange={() => updateMode(null)}
                className="mr-2"
              />
              I'm feeling lucky (random)
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="mode"
                checked={currentMode === "character"}
                onChange={() => updateMode("character")}
                className="mr-2"
              />
              Character mode
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="mode"
                checked={currentMode === "pinyin"}
                onChange={() => updateMode("pinyin")}
                className="mr-2"
              />
              Pinyin mode
            </label>
          </div>
        </div>

        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-medium">Lessons</h3>
            <Button
              name={
                selectedLessons.length === allLessons.length
                  ? "Deselect All"
                  : "Select All"
              }
              onClick={toggleAllLessons}
            />
          </div>
          <div className="max-h-40 overflow-y-auto rounded border border-gray-200 p-2">
            {allLessons.map((lesson) => (
              <label key={lesson} className="mb-1 flex items-center">
                <input
                  type="checkbox"
                  checked={selectedLessons.includes(lesson)}
                  onChange={() => toggleLesson(lesson)}
                  className="mr-2"
                />
                {lesson}
              </label>
            ))}
          </div>
          {selectedLessons.length === 0 && (
            <p className="mt-1 text-sm text-gray-500">
              When no lessons are selected, all lessons will be used.
            </p>
          )}
        </div>

        <div className="flex justify-end">
          <div className="px-4 py-2">
            <Button name="Close" onClick={closeModal} />
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default function App() {
  const [historyModalIsOpen, setHistoryModalIsOpen] = useState(false);
  const [settingsModalIsOpen, setSettingsModalIsOpen] = useState(false);
  const [mode, setMode] = useState<AppMode | null>(null);

  // Function to show modals
  const showHistoryModal = () => {
    setHistoryModalIsOpen(true);
  };

  const showSettingsModal = () => {
    setSettingsModalIsOpen(true);
  };

  // Function to close modals
  const closeHistoryModal = () => {
    setHistoryModalIsOpen(false);
  };

  const closeSettingsModal = () => {
    setSettingsModalIsOpen(false);
  };

  const history = useSelector(store, (state) => state.context.history);
  const times = useMemo(() => {
    const state = store.getSnapshot();
    const history = state.context.history;
    const rtf = new RelativeTime();
    let times = {
      character: {} as Record<string, string>,
      pinyin: {} as Record<string, string>,
    };

    Object.entries(history.character).forEach(([char, [_, sessionId]]) => {
      if (state.context.sessions[sessionId]) {
        const time = new Date(state.context.sessions[sessionId]);
        times.character[char] = rtf.from(time);
      }
    });
    Object.entries(history.pinyin).forEach(([char, [_, sessionId]]) => {
      if (state.context.sessions[sessionId]) {
        const time = new Date(state.context.sessions[sessionId]);
        times.pinyin[char] = rtf.from(time);
      }
    });
    return times;
  }, [history]);

  const currentId = useSelector(
    store,
    (state) => state.context.sentences[0].id,
  );
  const numSentences = useSelector(
    store,
    (state) => state.context.sentences.length,
  );
  return (
    <div className="flex h-screen w-full flex-col items-center text-2xl">
      {/* Fixed header area */}
      <div className="w-full flex-shrink-0 px-20 pt-20">
        <div className="flex justify-center">
          <SentenceDetails />
        </div>
      </div>

      {/* Scrollable middle content area */}
      <div className="w-full flex-grow overflow-y-auto px-20">
        {/* Container that constrains character component width */}
        <div className="mx-auto w-[50rem] py-4">
          <SentenceReview key={currentId} mode={mode} />
        </div>
      </div>

      <MyModal
        modalIsOpen={historyModalIsOpen}
        closeModal={closeHistoryModal}
        relativeTimes={times}
        history={history}
      />

      <SettingsModal
        modalIsOpen={settingsModalIsOpen}
        closeModal={closeSettingsModal}
        currentMode={mode}
        setMode={setMode}
      />

      {/* Fixed footer area */}
      <div className="w-full flex-shrink-0 p-5 px-20">
        <Footer
          showModal={showHistoryModal}
          showSettingsModal={showSettingsModal}
          progressSentence={() => store.trigger.progressSentence()}
        />
      </div>
    </div>
  );
}
