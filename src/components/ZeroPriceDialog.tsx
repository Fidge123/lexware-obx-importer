import {
  Description,
  Dialog,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import type { ZeroPrice } from "../obx.ts";

export function ZeroPriceDialog({ isOpen, zeroPrices, onClose }: Props) {
  if (zeroPrices.length === 0) {
    return null;
  }

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 flex w-screen items-center justify-center bg-gray-500/30 p-4">
        <DialogPanel className="max-w-2xl space-y-4 rounded-xl border bg-white p-8 drop-shadow-lg">
          <DialogTitle className="font-bold text-lg text-red-600">
            Achtung: Artikel ohne Preis
          </DialogTitle>
          <Description className="text-gray-700">
            <span className="font-semibold">{zeroPrices.length} Artikel</span>{" "}
            {zeroPrices.length === 1
              ? "hat keinen Preis und wird"
              : "haben keinen Preis und werden"}{" "}
            mit 0,00 EUR übernommen. Bitte die Preise in pCon aktualisieren und
            neu exportieren oder manuell nachtragen.
          </Description>
          <ul className="max-h-64 space-y-1 overflow-auto rounded bg-red-50 p-4 text-sm">
            {zeroPrices.map(({ artNr, name }) => (
              <li key={artNr}>
                <span className="font-mono">{artNr}</span>
                {name && <span className="text-gray-500"> | {name}</span>}
              </li>
            ))}
          </ul>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="whitespace-nowrap rounded-md bg-blue-500 px-3 py-1.5 font-semibold text-sm text-white shadow transition-all hover:bg-blue-600"
            >
              Verstanden
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}

interface Props {
  isOpen: boolean;
  zeroPrices: ZeroPrice[];
  onClose: () => void;
}
