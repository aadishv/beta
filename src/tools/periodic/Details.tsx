import React, { useState, useCallback, useEffect } from "react";
import {
  type ElementType,
  type ElementTypeString,
  TEXT_COLORS,
  getGradientStyle,
  BG_COLORS,
} from "./Utils";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MAX_DETAILS = 7;

interface DetailsViewProps {
  elementNumber: number;
  periodicData: ElementType[];
}

interface DetailRowProps {
  name: string;
  value: string | number;
}

const DetailRow = ({ name, value }: DetailRowProps) => {
  const [iconName, setIconName] = useState<string>("copy");

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(String(value));
    setIconName("check2");
    setTimeout(() => setIconName("copy"), 500);
  }, [value]);

  return (
    <div className="grid grid-cols-[1fr_2fr] gap-x-2">
      <dt className="font-medium text-right">{name}</dt>
      <dd className="text-muted-foreground">{value}</dd>
    </div>
  );
};

const Divider = () => (
  <div className="w-full border-t border-border dark:border-border my-1" />
);

const DetailsView = ({ elementNumber, periodicData }: DetailsViewProps) => {
  const element = periodicData[elementNumber - 1];
  const textColor = TEXT_COLORS[element.type as ElementTypeString];

  // Prepare details to display, up to MAX_DETAILS
  const details = [
    { name: "Name", value: element.name },
    { name: "Symbol", value: element.symbol },
    { name: "Atomic Number", value: element.number },
    { name: "Atomic Mass", value: element.atomic_mass },
    { name: "Group", value: element.type },
    { name: "Electron Configuration", value: element.electron_configuration_semantic },
    { name: "Electronegativity", value: element.electronegativity_pauling ?? "N/A" },
    {
      name: "Oxidation States",
      value: element.oxistates?.map((state) => (state > 0 ? `+${state}` : state)).join(", ") ?? "N/A",
    },
    { name: "Fun Fact", value: element.fun_fact },
  ].slice(0, MAX_DETAILS);

  useEffect(() => {
    const el = document.getElementById(`element-${elementNumber}`);
    if (el) {
      el.focus();
    }
  }, [elementNumber]);

  return (
    <Card
      className="w-25vw m-2 flex h-full flex-col"
      style={{
        maxHeight: "90vh",
        width: "25vw",
        background: element ? getGradientStyle(element.type) : undefined,
        color: element ? textColor : undefined,
      }}
    >
      <CardHeader className="bg-card text-card-foreground">
        <CardTitle className="font-serif text-3xl">{element.name}</CardTitle>
        <CardDescription className="text-xl">
          ({element.number}, {element.symbol})
        </CardDescription>
      </CardHeader>
      <CardContent
        id="details"
        style={{
          height: "100%",
          minHeight: "100%",
          overflow: "hidden",
        }}
      >
            <React.Fragment key={detail.name}>
              <Divider />
            </React.Fragment>
          ))}
              href={`https://www.google.com/search?q=${encodeURIComponent(
                `${element.name} chemical element`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-lg underline text-card-foreground hover:text-primary dark:hover:text-primary"
            >
              Search on Google
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DetailsView;
