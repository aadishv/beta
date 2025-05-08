import React from "react";
import { useTheme } from "./ThemeProvider";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <Button variant="ghost" onClick={toggleTheme} aria-label="Toggle theme">
      {theme === "dark" ? "🌙 Dark" : "☀️ Light"}
    </Button>
  );
}
