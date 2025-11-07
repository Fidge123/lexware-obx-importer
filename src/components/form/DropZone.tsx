import { getCurrentWebview } from "@tauri-apps/api/webview";
import { readTextFile } from "@tauri-apps/plugin-fs";
import type React from "react";
import { useState } from "react";

interface DropZoneProps {
  loadedFiles: string[];
  onFileSelect: (content: Promise<string>, filename: string) => void;
  onFileRemove: (filename: string) => void;
}

export function DropZone({
  loadedFiles,
  onFileSelect,
  onFileRemove,
}: DropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  void getCurrentWebview().onDragDropEvent((ev) => {
    if (ev.payload.type === "over") {
      setIsDragOver(true);
    } else if (ev.payload.type === "drop") {
      const name =
        ev.payload.paths[0]?.split("/").pop() || "Dateiname unbekannt";
      onFileSelect(readTextFile(ev.payload.paths[0]), name);
      setIsDragOver(false);
    } else {
      setIsDragOver(false);
    }
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelect(file.text(), file.name);
    }
    // Reset the input so the same file can be selected again
    event.target.value = "";
  };

  const handleAddClick = () => {
    const fileInput = document.getElementById("fileInput") as HTMLInputElement;
    fileInput?.click();
  };

  // If no files loaded, show the original drop zone
  if (loadedFiles.length === 0) {
    return (
      <>
        <button
          type="button"
          className={`w-full cursor-pointer rounded-xl border-2 border-gray-300 border-dashed bg-white p-8 text-center text-gray-500 transition-colors hover:border-blue-500 hover:bg-blue-50 ${
            isDragOver ? "border-blue-500 bg-blue-50" : ""
          }`}
          onClick={handleAddClick}
        >
          <p>Drag & Drop oder anklicken</p>
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

  // If files are loaded, show them as chips with an add button
  return (
    <>
      <section
        aria-label="Geladene OBX-Dateien"
        className={`w-full rounded-xl border-2 border-gray-300 border-dashed bg-white p-4 transition-colors ${
          isDragOver ? "border-blue-500 bg-blue-50" : ""
        }`}
      >
        <div className="flex flex-wrap gap-2">
          {loadedFiles.map((filename) => (
            <div
              key={filename}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-100 px-3 py-2 text-sm"
            >
              <span className="text-blue-800">{filename}</span>
              <button
                type="button"
                onClick={() => onFileRemove(filename)}
                className="text-blue-600 transition-colors hover:text-blue-800"
                aria-label={`${filename} entfernen`}
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddClick}
            className="inline-flex items-center justify-center rounded-lg border-2 border-gray-300 border-dashed bg-white px-4 py-2 text-gray-500 transition-colors hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600"
            aria-label="Weitere Datei hinzufügen"
          >
            +
          </button>
        </div>
      </section>
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
