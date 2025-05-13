import React, { useState, useRef, useEffect } from "react";
import HanziWriter from "hanzi-writer";
import { useSelector, useStore } from "@xstate/store/react";
import { store, type AppMode } from "./Store";
import { CharState } from "./Data";

const CHARACTER_SIZE_STYLE = "h-28 w-28";

function convertNumberTonesToMarks(pinyin: string): string {
  const pinyinLower = pinyin.toLowerCase();

  // Map of vowels and their tone variants
  const toneMap: Record<string, string[]> = {
    "a": ["ā", "á", "ǎ", "à"],
    "e": ["ē", "é", "ě", "è"],
    "i": ["ī", "í", "ǐ", "ì"],
    "o": ["ō", "ó", "ǒ", "ò"],
    "u": ["ū", "ú", "ǔ", "ù"],
    "ü": ["ǖ", "ǘ", "ǚ", "ǜ"],
    "v": ["ǖ", "ǘ", "ǚ", "ǜ"], // v is often used as a substitute for ü
  };

  // No tone number found, return as is
  if (!/[1-4]$/.test(pinyinLower)) {
    return pinyinLower;
  }

  // Extract tone number and remove it from the string
  const toneNumber = parseInt(pinyinLower.slice(-1)) - 1;
  const pinyinWithoutTone = pinyinLower.slice(0, -1);

  // Replace 'v' with 'ü' first
  const normalizedPinyin = pinyinWithoutTone.replace(/v/g, "ü");

  // Priority order for tone marks
  const vowelPriority = ["a", "e", "o", "i", "u", "ü"];

  // Find the vowel to modify based on priority
  for (const vowel of vowelPriority) {
    if (normalizedPinyin.includes(vowel)) {
      // Replace the first occurrence of this vowel with its toned version
      return normalizedPinyin.replace(vowel, toneMap[vowel][toneNumber]);
    }
  }

  // No vowel found to modify, return as is
  return normalizedPinyin;
}
function normalizePinyin(input: string): string {
  // Remove spaces and make lowercase
  const trimmed = input.toLowerCase().trim();

  // Check if this is likely a number-tone pinyin
  if (/[a-z]+[1-4]$/.test(trimmed)) {
    return convertNumberTonesToMarks(trimmed);
  }

  return trimmed;
}

export function TrafficLights({
  checkMark,
  state,
}: {
  checkMark: boolean;
  state: CharState;
}) {
  const checkMarkElement = (
    <svg
      width="20"
      height="20"
      viewBox="0 0 16 16"
      xmlns="http://www.w3.org/2000/svg"
      fill="white"
    >
      <path
        fillRule="evenodd"
        d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0z"
      />
    </svg>
  );
  return (
    <div className="flex gap-2">
      <div
        className={`h-5 w-5 rounded-full bg-green-500 transition-all ${state === CharState.green ? "hover:opacity-70" : "opacity-30 hover:opacity-15"}`}
      >
        {checkMark && state === CharState.green && checkMarkElement}
      </div>
      <div
        className={`h-5 w-5 rounded-full bg-yellow-500 transition-all ${state === CharState.yellow ? "hover:opacity-70" : "opacity-30 hover:opacity-15"}`}
      >
        {checkMark && state === CharState.yellow && checkMarkElement}
      </div>
      <div
        className={`h-5 w-5 rounded-full bg-red-500 transition-all ${state === CharState.red ? "hover:opacity-70" : "opacity-30 hover:opacity-15"}`}
      >
        {checkMark && state === CharState.red && checkMarkElement}
      </div>
    </div>
  );
}

export function Review({
  character,
  pinyin,
  persistentId,
  mode,
}: {
  character: string;
  pinyin: string;
  persistentId: string;
  mode: AppMode;
}) {
  if (pinyin === "") {
    useEffect(() => {
      store.trigger.increaseCompletedCount();
    }, []); // Empty dependency array ensures this runs only once on mount

    return (
      // Single div with appropriate top padding to align with other characters
      <div className="mt-24 inline-flex flex-col items-center px-2">
        <span
          className="font-kaishu text-5xl text-gray-600"
          title="Punctuation"
        >
          {character}
        </span>
      </div>
    );
  }
  const data = {
    char: character,
    id: persistentId,
    mode: mode,
  };
  const local_store = useStore({
    context: {
      mistakes: 0,
      state: CharState.green,
      state2: CharState.green,
      isCompleted: false,
      mistakesToYellow: data.mode == "character" ? 5 : 2,
      mistakesToRed: data.mode == "character" ? 4 : 7,
      parentData: data,
    },
    emits: {
      showSolution: () => {},
      showPartialSolution: () => {},
    },
    on: {
      solved: (context, event: {}, enqueue) => {
        setTimeout(() => enqueue.emit.showSolution(), 400);
        store.trigger.updateCharacter({
          character: context.parentData.char,
          newState: context.state,
          id: context.parentData.id,
          mode: context.parentData.mode,
        });
        return { ...context, isCompleted: true };
      },
      mistake: (context) => {
        const newMistakes = context.mistakes + 1;

        if (
          context.state === CharState.green &&
          newMistakes >= context.mistakesToYellow
        ) {
          return {
            ...context,
            mistakes: 0,
            state: CharState.yellow,
          };
        }

        if (
          context.state === CharState.yellow &&
          newMistakes >= context.mistakesToRed
        ) {
          return {
            ...context,
            mistakes: 0,
            state: CharState.red,
          };
        }

        return { ...context, mistakes: newMistakes };
      },
      button: (context, event: {}, enqueue) => {
        if (context.isCompleted) {
          return context;
        } else if (context.state2 === CharState.green) {
          enqueue.emit.showPartialSolution();
          return {
            ...context,
            state:
              context.state === CharState.red
                ? CharState.red
                : CharState.yellow,
            state2: CharState.yellow,
            mistakes: context.state === CharState.yellow ? context.mistakes : 0,
          };
        } else if (context.state2 === CharState.yellow) {
          local_store.trigger.solved();
          store.trigger.updateCharacter({
            character: context.parentData.char,
            newState: CharState.red,
            id: context.parentData.id,
            mode: context.parentData.mode,
          });
          return {
            ...context,
            state: CharState.red,
            state2: CharState.red,
            isCompleted: true,
          };
        }
      },
    },
  });

  const state = useSelector(local_store, (state) => state.context.state);
  const isCompleted = useSelector(
    local_store,
    (state) => state.context.isCompleted,
  );
  const buttonName = useSelector(local_store, (state) => {
    if (state.context.isCompleted) {
      return mode == "character" ? "Replay" : "Completed";
    }
    return state.context.state2 === CharState.green
      ? mode == "character"
        ? "Show outline"
        : "Show letters"
      : "Show solution";
  });
  // CHARACTER STUFF
  const writerRef = useRef<HTMLDivElement>(null);
  const [writer, setWriter] = useState<HanziWriter | null>(null);
  useEffect(() => {
    const localWriter = HanziWriter.create(writerRef!.current as HTMLElement, character, {
      padding: 5,
      strokeColor: mode == "character" ? "#0851D0" : "#000000",
      drawingColor: mode == "character" ? "#0851D0" : "#000000",
      outlineColor: mode === "pinyin" ? "#000000" : "rgba(130, 169, 229, 0.5)",
      acceptBackwardsStrokes: true,
      showHintAfterMisses: false,
      showOutline: mode === "pinyin",
      strokeFadeDuration: 0,
    });
    setWriter(localWriter);
    if (mode == "character") {
      localWriter.quiz({
        onMistake: local_store.trigger.mistake,
        onComplete: () => local_store.trigger.solved(),
        leniency: 1.2,
      });

      const subscription = local_store.on("showSolution", ({}) => {
        localWriter.animateCharacter();
      });
      const subscription2 = local_store.on("showPartialSolution", ({}) => {
        localWriter.showOutline();
      });
      return () => {
        subscription.unsubscribe();
        subscription2.unsubscribe();
      };
    }
  }, []);
  // PINYIN STUFF
  const [input, setInput] = useState(mode == "character" ? pinyin : "");
  const [isErrorAnimating, setIsErrorAnimating] = useState(false);
  const submitted = () => {
    if (!input.trim()) return;

    const normalizedInput = normalizePinyin(input);
    const normalizedPinyin = normalizePinyin(pinyin);
    if (normalizedInput === normalizedPinyin) {
      local_store.trigger.solved();
    } else {
      local_store.trigger.mistake();
      setIsErrorAnimating(true);
      setTimeout(() => setIsErrorAnimating(false), 400);
    }
  };
  if (mode === "pinyin") {
    useEffect(() => {
      const subscription = local_store.on("showSolution", ({}) => {
        setInput(pinyin);
      });
      const subscription2 = local_store.on("showPartialSolution", ({}) => {
        const noTones = pinyin.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        setInput(noTones);
      });
      return () => {
        subscription.unsubscribe();
        subscription2.unsubscribe();
      };
    }, []);
  }
  // MAIN UI
  return (
    <div className="mb-2 flex w-28 flex-col">
      {/* HEADER */}
      <div className="w-full">
        <button
          className={`font-lora text-base underline decoration-header2 hover:decoration-header ${mode === "pinyin" && isCompleted ? "text-gray-500" : ""}`}
          onClick={() => {
            if (isCompleted) {
              writer!.animateCharacter();
            } else {
              local_store.trigger.button();
            }
          }}
          disabled={isCompleted && mode === "pinyin"}
        >
          {buttonName}
        </button>
        <TrafficLights state={state} checkMark={isCompleted} />
      </div>
      {/* CHARACTER UI */}
      <div
        className={`mt-2 ${CHARACTER_SIZE_STYLE} border border-header bg-white`}
        ref={writerRef}
      ></div>
      {/* PINYIN UI */}
      <div className="relative mx-auto w-28">
        <div className="flex">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className={`w-full bg-transparent py-1 text-center font-lora ${mode === "pinyin" ? "text-header underline" : ""} outline-none ${isErrorAnimating ? "opacity-50 transition-all duration-300" : "transition-all duration-300"} ${isErrorAnimating ? "decoration-red-500" : "decoration-header2"}`}
            disabled={isCompleted || mode !== "pinyin"}
            placeholder="Pinyin"
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              submitted();
            }}
          />
        </div>
      </div>
    </div>
  );
}
