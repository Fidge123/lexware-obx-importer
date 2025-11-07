import { getCurrentWebview } from "@tauri-apps/api/webview";
import { readTextFile } from "@tauri-apps/plugin-fs";
import type React from "react";
import { useState } from "react";

interface DropZoneProps {
  onFileSelect: (content: Promise<string>) => void;
}

export function DropZone({ onFileSelect }: DropZoneProps) {
  const originalDropText = "Drag & Drop oder anklicken";
  const [dropText, setDropText] = useState(originalDropText);

  void getCurrentWebview().onDragDropEvent((ev) => {
    if (ev.payload.type === "over" && dropText) {
      setDropText("+");
    } else if (ev.payload.type === "drop") {
      const name =
        ev.payload.paths[0]?.split("/").pop() || "Dateiname unbekannt";
      onFileSelect(readTextFile(ev.payload.paths[0]));
      setDropText(name);
      // updatePreview();
    } else {
      if (dropText) {
        setDropText(originalDropText);
      }
    }
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelect(file.text());
      setDropText(file.name);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      onFileSelect(file.text());
      setDropText(file.name);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setDropText("+");
  };

  const handleClick = () => {
    const fileInput = document.getElementById("fileInput") as HTMLInputElement;
    fileInput?.click();
  };

  return (
    <>
      <button
        type="button"
        id="dropZone"
        className="w-full cursor-pointer rounded-xl border-2 border-gray-300 border-dashed bg-white p-8 text-center text-gray-500 hover:border-blue-500 hover:bg-blue-50"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={handleClick}
      >
        <p>{dropText}</p>
      </button>
      <input
        id="fileInput"
        type="file"
        accept=".obx,application/obx+xml"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
    </>
  );
}
