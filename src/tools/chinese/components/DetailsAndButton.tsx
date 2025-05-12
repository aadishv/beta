import { useState } from "react";
import { useSelector } from "@xstate/store/react";
import { store } from "../Store";
import type { Sentence } from "../Data";

/**
 * Simple button component that renders a clickable button with underline decoration
 * @param {string} name - The text to display on the button
 * @param {() => void} onClick - Click handler function
 */
export function Button({
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
export function SentenceDetails() {
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
