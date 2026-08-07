import {
  Description,
  Dialog,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { useState } from "react";

const defaultSurcharge = "40";

function formatEur(value: number): string {
  return value.toLocaleString("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function NonDiscountedWarningDialog({
  isOpen,
  onClose,
  onApplySurcharge,
  count,
  totalValue,
}: Props) {
  const [surcharge, setSurcharge] = useState(defaultSurcharge);

  if (count === 0) {
    return null;
  }

  const percentage = parseFloat(surcharge);
  const isValidPercentage = Number.isFinite(percentage) && percentage >= 0;

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 flex w-screen items-center justify-center bg-gray-500/30 p-4">
        <DialogPanel className="max-w-lg space-y-4 rounded-xl border bg-white p-8 drop-shadow-lg">
          <DialogTitle className="font-bold text-lg text-orange-600">
            Achtung: Artikel ohne Rabatt gefunden
          </DialogTitle>
          <Description className="text-gray-700">
            Es wurden <span className="font-semibold">{count} Artikel</span>{" "}
            ohne Herstellerrabatt gefunden.
          </Description>
          <div className="rounded bg-orange-50 p-4">
            <p className="font-semibold text-gray-900">
              Gesamtwert (Nettopreis):{" "}
              <span className="text-orange-700">
                {formatEur(totalValue)} EUR
              </span>
            </p>
          </div>
          <p className="text-gray-600 text-sm">
            Die betroffenen Artikel sind in der Liste mit "NETTO" bzw.
            "Teilweise NETTO" gekennzeichnet.
          </p>
          <label className="flex items-center justify-between gap-4 text-sm">
            Aufschlag auf Artikel ohne Rabatt in %
            <input
              type="number"
              min={0}
              step="any"
              autoComplete="off"
              value={surcharge}
              onChange={(e) => setSurcharge(e.target.value)}
              className="w-32 rounded-lg border border-gray-300 px-2 py-1 transition-all focus:ring-2 focus:ring-blue-500"
            />
          </label>
          {isValidPercentage && (
            <p className="text-gray-600 text-sm">
              Gesamtwert mit Aufschlag:{" "}
              <span className="font-semibold">
                {formatEur(totalValue * (1 + percentage / 100))} EUR
              </span>
            </p>
          )}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-lg border bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600"
            >
              Verstanden
            </button>
            <button
              type="button"
              disabled={!isValidPercentage}
              onClick={() => onApplySurcharge(percentage)}
              className="w-full rounded-lg border bg-orange-600 px-4 py-2 text-white transition-colors hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Aufschlag hinzufügen
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
  onApplySurcharge: (percentage: number) => void;
  count: number;
  totalValue: number;
}
