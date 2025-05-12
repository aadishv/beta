import { useMemo, useState } from "react";
import RelativeTime from "@yaireo/relative-time";
import { useSelector } from "@xstate/store/react";
import { store, type AppMode } from "./Store";
import MyModal from "./components/MyModal";
import SettingsModal from "./components/SettingsModal";
import { SentenceReview, Footer } from "./components/SentenceReviewAndFooter";
import { Button, SentenceDetails } from "./components/DetailsAndButton";




export default function App() {
  const [historyModalIsOpen, setHistoryModalIsOpen] = useState(false);
  const [settingsModalIsOpen, setSettingsModalIsOpen] = useState(false);
  const [mode, setMode] = useState<AppMode | null>(null);

  // Function to show modals
  const showHistoryModal = () => setHistoryModalIsOpen(true);
  const showSettingsModal = () => setSettingsModalIsOpen(true);

  // Function to close modals
  const closeHistoryModal = () => setHistoryModalIsOpen(false);
  const closeSettingsModal = () => setSettingsModalIsOpen(false);

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
