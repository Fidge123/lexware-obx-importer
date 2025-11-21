import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { useState } from "react";
import * as XLSX from "xlsx";
import { ApiKeyInput } from "./form/ApiKeyInput.tsx";
import { DescriptionToggle } from "./form/DescriptionToggle.tsx";
import { GroupingToggle } from "./form/GroupingToggle.tsx";

export function SettingsModal({
  isOpen,
  onClose,
  onApiKeyChange,
  onGroupingChange,
  onDescriptionChange,
  onNonDiscountedListChange,
}: Props) {
  const [xlsxFileName, setXlsxFileName] = useState<string | null>(
    localStorage.getItem("nonDiscountedFileName"),
  );

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
            <GroupingToggle onChange={onGroupingChange} />
            <DescriptionToggle onChange={onDescriptionChange} />

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

          <div className="flex justify-end">
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
  onGroupingChange: (value: boolean) => void;
  onDescriptionChange: (value: boolean) => void;
  onNonDiscountedListChange: (artNrs: Set<string>) => void;
}
