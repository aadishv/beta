import React, { useState, useEffect, useRef } from "react";
import katex from "katex";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";

export default function App() {
  const [latex, setLatex] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("latex-input") || "\\text{Your equation here}";
    }
    return "\\text{Your equation here}";
  });
  const [imageUrl, setImageUrl] = useState("");
  const [format, setFormat] = useState("svg");
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!previewRef.current) return;
    const value = latex.trim().length === 0 ? "\\text{Your equation here}" : latex;
    const url = `https://latex.codecogs.com/${format}.image?${encodeURIComponent(value)}`;
    setImageUrl(url);

    previewRef.current.innerHTML = "";
    try {
      katex.render(value, previewRef.current, {
        displayMode: true,
        throwOnError: false,
        output: "mathml",
      });
    } catch (e: any) {
      previewRef.current.textContent = e.message;
    }
  }, [latex, format]);

  const copyImageUrl = async () => {
    await navigator.clipboard.writeText(imageUrl);
  };

  const copyMarkdown = async () => {
    await navigator.clipboard.writeText(`![LaTeX image](${imageUrl})`);
  };

 // To enable image copying, install html2canvas:
 // npm install html2canvas
 const copyImage = async () => {
   if (!previewRef.current) return;
   // Save original styles to restore after capture
   const prevOverflow = previewRef.current.style.overflow;
   const prevHeight = previewRef.current.style.height;
   const prevPaddingBottom = previewRef.current.style.paddingBottom;
   try {
     // Temporarily ensure full content is visible and add padding to avoid clipping
     previewRef.current.style.overflow = "visible";
     previewRef.current.style.height = "auto";
     previewRef.current.style.paddingBottom = "24px";
     // Dynamically import html2canvas to avoid errors if not installed
     const html2canvas = (await import("html2canvas")).default;
     // Use scrollHeight to ensure full content is captured
     const height = previewRef.current.scrollHeight;
     const canvas = await html2canvas(previewRef.current, {
       backgroundColor: null,
       useCORS: true,
       scale: 2,
       height,
       windowHeight: height,
     });
     canvas.toBlob(async (blob) => {
       if (!blob) throw new Error("Failed to create image blob.");
       const clipboardItem = new window.ClipboardItem({ [blob.type]: blob });
       await navigator.clipboard.write([clipboardItem]);
       // Optionally: show a toast or alert for success
     }, "image/png");
   } catch (e) {
     alert("Copying image failed. Make sure html2canvas is installed and your browser supports image clipboard.");
   } finally {
     // Restore original styles
     if (previewRef.current) {
       previewRef.current.style.overflow = prevOverflow;
       previewRef.current.style.height = prevHeight;
       previewRef.current.style.paddingBottom = prevPaddingBottom;
     }
   }
 };

  return (
    <div className="m-8">
      <Card>
        <CardHeader>
          <CardTitle>LaTeX to Image</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Label htmlFor="latex-input">LaTeX</Label>
          <Input
            id="latex-input"
            type="text"
            value={latex}
            onChange={(e) => {
              setLatex(e.target.value);
              if (typeof window !== "undefined") {
                localStorage.setItem("latex-input", e.target.value);
              }
            }}
            placeholder="Type LaTeX here"
          />

          <Label htmlFor="format-select">Format</Label>
          <Select value={format} onValueChange={setFormat}>
            <SelectTrigger id="format-select" className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="svg">svg</SelectItem>
              <SelectItem value="png">png</SelectItem>
              <SelectItem value="gif">gif</SelectItem>
            </SelectContent>
          </Select>

          <div>
            <a
              href={imageUrl}
              className="break-all underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {imageUrl}
            </a>
          </div>

          <div className="flex flex-wrap gap-4">
            <Button variant="outline" onClick={copyImageUrl}>
              Copy image URL
            </Button>
            <Button variant="outline" onClick={copyMarkdown}>
              Copy image Markdown
            </Button>
            <Button variant="outline" onClick={copyImage}>
              Copy image
            </Button>
          </div>

          <div className="mt-4 overflow-auto rounded-lg border p-4 text-xl">
            <div ref={previewRef} className="flex items-center" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
