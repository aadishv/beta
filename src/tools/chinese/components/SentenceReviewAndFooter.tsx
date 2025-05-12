import React, { useEffect, useRef } from "react";
import { useSelector } from "@xstate/store/react";
import { Review } from "../Review";
import { store, type AppMode } from "../Store";

/**
 * Component that renders a full sentence review interface with multiple characters
 */
export function SentenceReview({ mode }: { mode: AppMode | null }) {
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

type FooterProps = {
  showModal: () => void;
  showSettingsModal: () => void;
  progressSentence: () => void;
};

export function Footer({
  showModal,
  showSettingsModal,
  progressSentence,
}: FooterProps) {
  return (
    <div className="flex w-full">
      <div className="mb-0 mr-auto flex flex-row gap-5">
        <button
          className="m-0 h-8 justify-center truncate p-0 font-lora underline transition-all duration-300 ease-in-out hover:decoration-header decoration-header2"
          onClick={() => {
            window.location.href = "/blog/using-chinese";
          }}
        >
          help
        </button>
        <button
          className="m-0 h-8 justify-center truncate p-0 font-lora underline transition-all duration-300 ease-in-out hover:decoration-header decoration-header2"
          onClick={showModal}
        >
          history
        </button>
        <button
          className="m-0 h-8 justify-center truncate p-0 font-lora underline transition-all duration-300 ease-in-out hover:decoration-header decoration-header2"
          onClick={showSettingsModal}
        >
          settings
        </button>
      </div>
      <div className="mb-0 ml-auto flex flex-row gap-5">
        <button
          className="m-0 h-8 justify-center truncate p-0 font-lora underline transition-all duration-300 ease-in-out hover:decoration-header decoration-header2"
          onClick={progressSentence}
        >
          continue
        </button>
      </div>
    </div>
  );
}
