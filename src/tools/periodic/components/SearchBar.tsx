import React, { useRef, useEffect, useCallback } from "react";
import Fuse from "fuse.js";
import elements from "../periodic.json";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { ElementType } from "../types";

const fuseOptions = {
  keys: [
    { name: "name", weight: 0.7 },
    { name: "symbol", weight: 0.3 },
    { name: "number", weight: 0.1 },
  ],
};
const fuse = new Fuse(elements, fuseOptions);

interface SearchBarProps {
  focusElementByNumber: (atomicNumber: number) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ focusElementByNumber }) => {
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: Ctrl+F, Cmd+F, Ctrl+K, Cmd+K
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = (searchInputRef.current?.value || "").trim().toLowerCase();
    if (!query) return;
    const results = fuse.search(query);
    if (results.length > 0) {
      const element = results[0].item as ElementType;
      focusElementByNumber(element.number);
    }
  };

  return (
    <form
      onSubmit={handleSearch}
      className="flex items-center gap-2 w-full"
    >
      <Input
        ref={searchInputRef}
        type="text"
        placeholder="Search elements (name, symbol, number)…"
        className="max-w-xs"
        aria-label="Search elements"
      />
      <Button type="submit" variant="outline">
        Search
      </Button>
    </form>
  );
};

export default SearchBar;
