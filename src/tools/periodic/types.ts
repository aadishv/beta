import elements from "./periodic.json";

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

export interface ElementType {
  number: number;
  symbol: string;
  name: string;
  atomic_mass: number;
  xpos: number;
  ypos: number;
  type: ElementTypeString;
  electron_configuration: string;
  electron_configuration_semantic: string;
  electronegativity_pauling?: number;
  oxistates?: number[];
  oxistates_extended?: number[];
  fun_fact: string;
}

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

export type ElementsDict = Record<string, number>;

export const parseFormula = (formula: string): ElementsDict => {
  // Recursive parser for chemical formulas with parentheses
  const parse = (str: string, start = 0): [ElementsDict, number] => {
    let elements: ElementsDict = {};
    let i = start;
    while (i < str.length) {
      if (str[i] === "(") {
        // Parse group
        const [groupElements, nextIdx] = parse(str, i + 1);
        i = nextIdx;
        // Parse multiplier after group
        let num = "";
        while (i < str.length && /[0-9]/.test(str[i])) {
          num += str[i++];
        }
        const multiplier = num ? parseInt(num) : 1;
        for (const [el, count] of Object.entries(groupElements)) {
          elements[el] = (elements[el] || 0) + count * multiplier;
        }
      } else if (str[i] === ")") {
        // End of group
        return [elements, i + 1];
      } else {
        // Parse element symbol
        const match = /^([A-Z][a-z]?)(\d*)/.exec(str.slice(i));
        if (!match) break;
        const [, element, count] = match;
        elements[element] = (elements[element] || 0) + (count ? parseInt(count) : 1);
        i += element.length + (count ? count.length : 0);
      }
    }
    return [elements, i];
  };
  const [elements] = parse(formula.replace(/\s/g, ""));
  return elements;
};
