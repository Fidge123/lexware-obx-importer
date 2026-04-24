import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { invoke } from "@tauri-apps/api/core";
import { useState } from "react";
import * as XLSX from "xlsx";
import { kmLogin } from "../api.ts";
import { ApiKeyInput } from "./form/ApiKeyInput.tsx";
import { DescriptionToggle } from "./form/DescriptionToggle.tsx";
import { GroupingToggle } from "./form/GroupingToggle.tsx";

export function SettingsModal({
  isOpen,
  onClose,
  onApiKeyChange,
  grouping,
  onGroupingChange,
  description,
  onDescriptionChange,
  onNonDiscountedListChange,
  kmUsername,
  onKmUsernameChange,
  kmPassword,
  onKmPasswordChange,
}: Props) {
  const [xlsxFileName, setXlsxFileName] = useState<string | null>(
    localStorage.getItem("nonDiscountedFileName"),
  );
  const [testStatus, setTestStatus] = useState<
    "testing" | "success" | `error: ${string}` | null
  >(null);
  const [updateStatus, setUpdateStatus] = useState<
    "checking" | "up-to-date" | "updated" | `error: ${string}` | null
  >(null);

  const handleUpdate = async () => {
    setUpdateStatus("checking");
    try {
      const found = await invoke<boolean>("trigger_update");
      setUpdateStatus(found ? "updated" : "up-to-date");
    } catch (err) {
      setUpdateStatus(
        `error: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  };

  const handleTestCredentials = async () => {
    setTestStatus("testing");
    try {
      await kmLogin(kmUsername, kmPassword);
      setTestStatus("success");
    } catch (err) {
      setTestStatus(
        `error: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  };

  const handleXlsxFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer);
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json<{
        __EMPTY?: string;
        __EMPTY_2?: string;
      }>(firstSheet, { header: 1 });

      // Extract artNr from column A where column C contains "Netto" (case-insensitive)
      const nonDiscountedArtNrs: string[] = [];
      for (const row of data as unknown[][]) {
        const artNr = row[0]; // Column A (index 0)
        const columnC = row[2]; // Column C (index 2)

        if (
          artNr &&
          typeof artNr === "string" &&
          columnC &&
          typeof columnC === "string" &&
          columnC.toLowerCase().includes("netto")
        ) {
          nonDiscountedArtNrs.push(artNr.trim());
        }
      }

      // Store in localStorage
      localStorage.setItem(
        "nonDiscountedArtNrs",
        JSON.stringify(nonDiscountedArtNrs),
      );
      localStorage.setItem("nonDiscountedFileName", file.name);
      setXlsxFileName(file.name);

      // Notify parent component
      onNonDiscountedListChange(new Set(nonDiscountedArtNrs));
    } catch (error) {
      console.error("Error parsing xlsx file:", error);
      alert("Fehler beim Laden der Excel-Datei.");
    }

    // Reset input
    event.target.value = "";
  };
  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-black/30" />

      <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
        <DialogPanel className="w-full max-w-2xl space-y-4 rounded-lg bg-white p-6 shadow-xl">
          <DialogTitle className="font-semibold text-lg">
            Einstellungen
          </DialogTitle>

          <div className="grid grid-cols-[1fr_2fr] items-center gap-4">
            <ApiKeyInput onChange={onApiKeyChange} />

            <label
              htmlFor="kmUsername"
              className="font-medium text-gray-700 text-sm"
            >
              Köttermann E-Mail:
            </label>
            <input
              id="kmUsername"
              type="email"
              value={kmUsername}
              onChange={(e) => {
                onKmUsernameChange(e.target.value);
                setTestStatus(null);
              }}
              placeholder="benutzer@beispiel.de"
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
            />

            <label
              htmlFor="kmPassword"
              className="font-medium text-gray-700 text-sm"
            >
              Köttermann Passwort:
            </label>
            <input
              id="kmPassword"
              type="password"
              value={kmPassword}
              onChange={(e) => {
                onKmPasswordChange(e.target.value);
                setTestStatus(null);
              }}
              placeholder="••••••••"
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
            />

            <div />
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={
                  !kmUsername || !kmPassword || testStatus === "testing"
                }
                onClick={handleTestCredentials}
                className="rounded-md bg-gray-100 px-3 py-1 font-medium text-gray-700 text-sm hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {testStatus === "testing" ? "Teste…" : "Verbindung testen"}
              </button>
              {testStatus === "success" && (
                <span className="text-green-600 text-sm">✓ Verbunden</span>
              )}
              {testStatus?.startsWith("error") && (
                <span className="text-red-600 text-sm">
                  {testStatus.replace("error: ", "")}
                </span>
              )}
            </div>

            <GroupingToggle value={grouping} onChange={onGroupingChange} />
            <DescriptionToggle
              value={description}
              onChange={onDescriptionChange}
            />

            <label
              htmlFor="xlsxFile"
              className="font-medium text-gray-700 text-sm"
            >
              Preisliste (Excel):
            </label>
            <div className="space-y-2">
              <input
                type="file"
                id="xlsxFile"
                accept=".xlsx,.xls"
                onChange={handleXlsxFileChange}
                className="block w-full text-gray-700 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:font-semibold file:text-blue-700 file:text-sm hover:file:bg-blue-100"
              />
              {xlsxFileName && (
                <p className="text-gray-600 text-xs">
                  Aktuell geladen: {xlsxFileName}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={updateStatus === "checking"}
                onClick={handleUpdate}
                className="rounded-md bg-gray-100 px-3 py-1.5 font-medium text-gray-700 text-sm hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {updateStatus === "checking" ? "Suche…" : "Nach Updates suchen"}
              </button>
              {updateStatus === "up-to-date" && (
                <span className="text-gray-600 text-sm">
                  Bereits aktuell
                </span>
              )}
              {updateStatus === "updated" && (
                <span className="text-green-600 text-sm">
                  Update wird installiert…
                </span>
              )}
              {updateStatus?.startsWith("error") && (
                <span className="text-red-600 text-sm">
                  {updateStatus.replace("error: ", "")}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md bg-blue-500 px-4 py-2 font-semibold text-sm text-white shadow transition-all hover:bg-blue-600"
            >
              Schließen
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onApiKeyChange: (key: string) => void;
  grouping: boolean;
  onGroupingChange: (value: boolean) => void;
  description: boolean;
  onDescriptionChange: (value: boolean) => void;
  onNonDiscountedListChange: (artNrs: Set<string>) => void;
  kmUsername: string;
  onKmUsernameChange: (value: string) => void;
  kmPassword: string;
  onKmPasswordChange: (value: string) => void;
}
