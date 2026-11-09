import {
  Description,
  Dialog,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import type { UnsafeObxVersion } from "../obxVersion.ts";

export function ObxVersionDialog({
  isOpen,
  versions,
  safeVersion,
  onClose,
  onSaveAsSafe,
}: Props) {
  if (versions.length === 0) {
    return null;
  }

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 flex w-screen items-center justify-center bg-gray-500/30 p-4">
        <DialogPanel className="max-w-lg space-y-4 rounded-xl border bg-white p-8 drop-shadow-lg">
          <DialogTitle className="font-bold text-lg text-orange-600">
            Achtung: Neue OBX-Version erkannt
          </DialogTitle>
          <Description className="text-gray-700">
            Die OBX-Version ist neuer als die zuletzt geprüfte Version{" "}
            <span className="font-semibold">{safeVersion}</span>. Bitte die
            importierten Daten sorgfältig auf Vollständigkeit und Richtigkeit
            prüfen.
          </Description>
          <ul className="space-y-1 rounded bg-orange-50 p-4 text-sm">
            {versions.map(({ filename, version }) => (
              <li key={filename} className="flex justify-between gap-4">
                {filename}
                <span className="font-semibold text-orange-700">{version}</span>
              </li>
            ))}
          </ul>
          <p className="text-gray-600 text-sm">
            Sind die Daten korrekt, kann die Version als sicher gespeichert
            werden. Dieser Hinweis erscheint dann erst wieder bei einer neueren
            Version.
          </p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="whitespace-nowrap rounded-md bg-white px-3 py-1.5 font-semibold text-sm shadow transition-all hover:bg-gray-200"
            >
              Verstanden
            </button>
            <button
              type="button"
              onClick={onSaveAsSafe}
              className="whitespace-nowrap rounded-md bg-orange-600 px-3 py-1.5 font-semibold text-sm text-white shadow transition-all hover:bg-orange-700"
            >
              Version als sicher speichern
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}

interface Props {
  isOpen: boolean;
  versions: UnsafeObxVersion[];
  safeVersion: string;
  onClose: () => void;
  onSaveAsSafe: () => void;
}
