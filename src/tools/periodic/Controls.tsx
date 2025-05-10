import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SearchBarProps {
  inputRef: React.RefObject<HTMLInputElement>;
  onSearch: (e: React.FormEvent) => void;
}

export const SearchBar = ({ inputRef, onSearch }: SearchBarProps) => {
  return (
    <form onSubmit={onSearch} className="flex">
      <Input
        ref={inputRef}
        type="text"
        placeholder="Search... (Cmd+F)"
        className="text-lg h-12 px-5 bg-background text-foreground border border-border dark:bg-card dark:text-card-foreground dark:border-border placeholder:text-muted-foreground dark:placeholder:text-muted-foreground"
        style={{ width: "56vw", marginRight: "2vw" }}
      />
      <button type="submit" className="sr-only">
        Submit
      </button>
    </form>
  );
};

interface RandomButtonProps {
  onClickRandom: () => void;
}

export const RandomButton = ({ onClickRandom }: RandomButtonProps) => {
  return (
    <div className="mr-4 flex items-end">
      <Button
        onClick={onClickRandom}
        variant="outline"
        className="text-lg h-12 px-5 bg-background text-foreground border-border dark:bg-card dark:text-card-foreground dark:border-border"
      >
        Random
      </Button>
    </div>
  );
};

interface ReferenceButtonProps {
  onClickReference: () => void;
}

export const ReferenceButton = ({ onClickReference }: ReferenceButtonProps) => {
  return (
    <div className="mr-4 flex items-end">
      <Button
        onClick={onClickReference}
        variant="outline"
        className="text-lg h-12 px-5 bg-background text-foreground border-border dark:bg-card dark:text-card-foreground dark:border-border"
      >
        References
      </Button>
    </div>
  );
};

interface ModalButtonProps {
  onClickModal: () => void;
  isDisabled?: boolean;
}

export const ModalButton = ({ onClickModal, isDisabled = false }: ModalButtonProps) => {
  const handleClick = () => {
    if (isDisabled) {
      alert("The formula mass calculator has been temporarily disabled on April 16-17, 2025 for the Stanford OHS OC005 quiz. Please try again after this date.");
      return;
    }
    onClickModal();
  };

  return (
    <div className="flex items-end">
      <Button
        variant="outline"
        onClick={handleClick}
        disabled={isDisabled}
        className="text-lg h-12 px-5 bg-background text-foreground border-border dark:bg-card dark:text-card-foreground dark:border-border"
      >
        Formula mass calculator
      </Button>
    </div>
  );
};

interface ControlsProps {
  searchInputRef: React.RefObject<HTMLInputElement>;
  handleSearch: (e: React.FormEvent) => void;
  handleRandomClick: () => void;
  handleReferenceModalOpen: () => void;
  handleMassModalToggle: () => void;
  isDisabled?: boolean;
}

export const Controls = ({
  searchInputRef,
  handleSearch,
  handleRandomClick,
  handleReferenceModalOpen,
  handleMassModalToggle,
  isDisabled = false
}: ControlsProps) => {
  return (
    <div className="flex" style={{ margin: "2vw" }}>
      <SearchBar inputRef={searchInputRef} onSearch={handleSearch} />
      <div className="flex-grow" />
      <RandomButton onClickRandom={handleRandomClick} />
      <ReferenceButton onClickReference={handleReferenceModalOpen} />
      <ModalButton onClickModal={handleMassModalToggle} isDisabled={isDisabled} />
    </div>
  );
};
