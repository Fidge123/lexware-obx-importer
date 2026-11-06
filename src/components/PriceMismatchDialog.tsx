import {
  Description,
  Dialog,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import type { PriceMismatch, PriceSource } from "../obx.ts";

function formatEur(value: number | null): string {
  if (value === null) {
    return "fehlt";
  }
  return `${value.toLocaleString("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} EUR`;
}

export function PriceMismatchDialog({ isOpen, mismatches, onChoose }: Props) {
  if (mismatches.length === 0) {
    return null;
  }

  const missingCount = mismatches.filter((m) => m.obxPrice === null).length;

  return (
    <Dialog
      open={isOpen}
      onClose={() => onChoose("obx")}
      className="relative z-50"
    >
      <div className="fixed inset-0 flex w-screen items-center justify-center bg-gray-500/30 p-4">
        <DialogPanel className="max-w-2xl space-y-4 rounded-xl border bg-white p-8 drop-shadow-lg">
          <DialogTitle className="font-bold text-lg text-orange-600">
            Achtung: Preise weichen von der Preisliste ab
          </DialogTitle>
          <Description className="text-gray-700">
            Bei{" "}
            <span className="font-semibold">
              {mismatches.length} Artikel{mismatches.length === 1 ? "" : "n"}
            </span>{" "}
            stimmt der Preis in der OBX-Datei nicht mit der Preisliste überein
            {missingCount > 0 && (
              <>
                {" "}
                (davon{" "}
                <span className="font-semibold">{missingCount} ohne Preis</span>{" "}
                in der OBX-Datei)
              </>
            )}
            . Welche Preise sollen verwendet werden?
          </Description>
          <div className="max-h-64 overflow-auto rounded border border-gray-200">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-3 py-2 font-medium">Artikel</th>
                  <th className="px-3 py-2 text-right font-medium">OBX</th>
                  <th className="px-3 py-2 text-right font-medium">
                    Preisliste
                  </th>
                </tr>
              </thead>
              <tbody>
                {mismatches.map((m) => (
                  <tr key={m.artNr} className="border-gray-100 border-t">
                    <td className="px-3 py-1.5">
                      <span className="font-mono">{m.artNr}</span>
                      {m.name && (
                        <span className="text-gray-500"> | {m.name}</span>
                      )}
                    </td>
                    <td
                      className={`whitespace-nowrap px-3 py-1.5 text-right ${
                        m.obxPrice === null ? "text-red-600" : ""
                      }`}
                    >
                      {formatEur(m.obxPrice)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-1.5 text-right">
                      {formatEur(m.listPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => onChoose("obx")}
              className="w-full rounded-lg border bg-white px-4 py-2 text-gray-700 shadow transition-colors hover:bg-gray-200"
            >
              OBX-Preise verwenden
            </button>
            <button
              type="button"
              onClick={() => onChoose("priceList")}
              className="w-full rounded-lg border bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600"
            >
              Preislisten-Preise verwenden
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}

interface Props {
  isOpen: boolean;
  mismatches: PriceMismatch[];
  onChoose: (source: PriceSource) => void;
}
