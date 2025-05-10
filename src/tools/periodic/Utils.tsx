export interface ElementType {
  number: number;
  symbol: string;
  name: string;
  atomic_mass: number;
  xpos: number;
  ypos: number;
  type: string;
  electron_configuration: string;
  electron_configuration_semantic: string;
  electronegativity_pauling?: number | null;
  oxistates?: number[];
  oxistates_extended?: number[];
  fun_fact: string;
}

export interface ElementsDict {
  [key: string]: number;
}

export type ElementTypeString =
  | "Alkali Metal"
  | "Alkaline Earth Metal"
  | "Transition Metal"
  | "Post-transition Metal"
  | "Metalloid"
  | "Reactive Nonmetal"
  | "Noble Gas"
  | "Lanthanide"
  | "Actinide"
  | "Unknown Chemical Properties";

// Constants for colors
export const TEXT_COLORS: Record<ElementTypeString, string> = {
  "Alkali Metal": "#00768D",
  "Alkaline Earth Metal": "#D60024",
  "Transition Metal": "#6232EC",
  "Post-transition Metal": "#002C00",
  Metalloid: "#945801",
  "Reactive Nonmetal": "#0060F1",
  "Noble Gas": "#CD1D5F",
  Lanthanide: "#003356",
  Actinide: "#C73201",
  "Unknown Chemical Properties": "#3F3750",
};

export const BG_COLORS: Record<ElementTypeString, string> = {
  "Alkali Metal": "#D7F8FF",
  "Alkaline Earth Metal": "#FFE6E5",
  "Transition Metal": "#F3E7FE",
  "Post-transition Metal": "#D8F9E9",
  Metalloid: "#FEF8E2",
  "Reactive Nonmetal": "#E1EDFF",
  "Noble Gas": "#FFE6EA",
  Lanthanide: "#E1F3FF",
  Actinide: "#FFE7D7",
  "Unknown Chemical Properties": "#E7E7EA",
};

// Helper to generate background color for an element type.
export const getGradientStyle = (elementType: string): string => {
  const backgroundColor =
    BG_COLORS[elementType as ElementTypeString] || "white";
  return `${backgroundColor}`;
};

export const parseFormula = (formula: string): ElementsDict => {
  const regex = /([A-Z][a-z]?)(\d*)/g;
  const elements: ElementsDict = {};
  let match: RegExpExecArray | null;

  while ((match = regex.exec(formula)) !== null) {
    const [, element, count] = match;
    elements[element] =
      (elements[element] || 0) + (count ? parseInt(count) : 1);
  }
  return elements;
};
