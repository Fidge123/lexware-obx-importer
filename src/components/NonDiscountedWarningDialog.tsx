import {
  Description,
  Dialog,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";

export function NonDiscountedWarningDialog({
  isOpen,
  onClose,
  count,
  totalValue,
}: Props) {
  if (count === 0) {
    return null;
  }

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
                {totalValue.toLocaleString("de-DE", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                EUR
              </span>
            </p>
          </div>
          <p className="text-gray-600 text-sm">
            Die betroffenen Artikel sind in der Liste mit "NETTO" bzw.
            "Teilweise NETTO" gekennzeichnet.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-lg border bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600"
          >
            Verstanden
          </button>
        </DialogPanel>
      </div>
    </Dialog>
  );
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  count: number;
  totalValue: number;
}
