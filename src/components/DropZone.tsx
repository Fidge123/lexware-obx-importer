import React, { useState } from "react";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { readTextFile } from "@tauri-apps/plugin-fs";

interface DropZoneProps {
  onFileSelect: (content: Promise<string>) => void;
}

export function DropZone({ onFileSelect }: DropZoneProps) {
  const originalDropText = "Drag & Drop oder anklicken";
  const [dropText, setDropText] = useState(originalDropText);

  getCurrentWebview().onDragDropEvent((ev) => {
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

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      onFileSelect(file.text());
      setDropText(file.name);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDropText("+");
  };

  const handleClick = () => {
    const fileInput = document.getElementById("fileInput") as HTMLInputElement;
    fileInput?.click();
  };

  return (
    <>
      <div
        id="dropZone"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={handleClick}
        style={{ cursor: "pointer" }}
      >
        <p>{dropText}</p>
      </div>
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
