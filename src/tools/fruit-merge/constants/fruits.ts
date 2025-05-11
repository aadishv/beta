import type { FruitSpec } from "../types";

export const FRUIT_ORDER: FruitSpec[] = [
  {
    id: 1,
    name: "Cherry",
    radius: 15,
    color: "bg-red-500",
    nextFruitId: 2,
    scoreValue: 10,
  },
  {
    id: 2,
    name: "Strawberry",
    radius: 22,
    color: "bg-pink-500",
    nextFruitId: 3,
    scoreValue: 20,
  },
  {
    id: 3,
    name: "Grape",
    radius: 30,
    color: "bg-purple-500",
    nextFruitId: 4,
    scoreValue: 40,
  },
  {
    id: 4,
    name: "Dekopon",
    radius: 38,
    color: "bg-yellow-400",
    nextFruitId: 5,
    scoreValue: 80,
  },
  {
    id: 5,
    name: "Orange",
    radius: 46,
    color: "bg-orange-500",
    nextFruitId: 6,
    scoreValue: 160,
  },
  {
    id: 6,
    name: "Apple",
    radius: 54,
    color: "bg-red-600",
    nextFruitId: 7,
    scoreValue: 320,
  },
  {
    id: 7,
    name: "Pear",
    radius: 62,
    color: "bg-green-500",
    nextFruitId: 8,
    scoreValue: 640,
  },
  {
    id: 8,
    name: "Peach",
    radius: 70,
    color: "bg-orange-300",
    nextFruitId: 9,
    scoreValue: 1280,
  },
  {
    id: 9,
    name: "Pineapple",
    radius: 78,
    color: "bg-yellow-500",
    nextFruitId: 10,
    scoreValue: 2560,
  },
  {
    id: 10,
    name: "Melon",
    radius: 86,
    color: "bg-green-400",
    nextFruitId: 11,
    scoreValue: 5120,
  },
  {
    id: 11,
    name: "Watermelon",
    radius: 94,
    color: "bg-green-600",
    nextFruitId: null,
    scoreValue: 10240,
  },
];

// Function to get a fruit by ID
export const getFruitById = (id: number): FruitSpec | undefined => {
  return FRUIT_ORDER.find((fruit) => fruit.id === id);
};

// Function to get a random fruit for dropping (from the first 3-5 fruits)
export const getRandomInitialFruit = (): FruitSpec => {
  const availableFruits = FRUIT_ORDER.slice(0, 4); // First 4 fruits (Cherry, Strawberry, Grape, Dekopon)
  const randomIndex = Math.floor(Math.random() * availableFruits.length);
  return availableFruits[randomIndex];
};

// Function to get the next fruit in progression
export const getNextFruitInProgression = (currentFruitId: number): FruitSpec | null => {
  const currentFruit = getFruitById(currentFruitId);
  if (currentFruit && currentFruit.nextFruitId !== null) {
    const nextFruit = getFruitById(currentFruit.nextFruitId);
    return nextFruit || null;
  }
  return null;
};
