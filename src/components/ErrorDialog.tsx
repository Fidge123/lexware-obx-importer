import {
  Description,
  Dialog,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import type { Quotation } from "../types";

export function ErrorDialog({ message, setMessage, payload }: Props) {
  return (
    <Dialog
      open={message !== ""}
      onClose={() => setMessage("")}
      className="relative z-50"
    >
      <div className="fixed inset-0 flex w-screen items-center justify-center bg-gray-500/30 p-4">
        <DialogPanel className="max-h-2xl max-w-2xl space-y-4 rounded-xl border bg-white p-12 drop-shadow-lg">
          <DialogTitle className="font-bold">
            Ein Fehler ist aufgetreten!
          </DialogTitle>
          <Description>{message}</Description>
          <pre className="max-h-64 overflow-auto rounded bg-gray-100 p-4 text-xs empty:hidden">
            {JSON.stringify(payload, null, 2)}
          </pre>
          <button
            type="button"
            onClick={() => setMessage("")}
            className="rounded-lg border bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600"
          >
            Schließen
          </button>
        </DialogPanel>
      </div>
    </Dialog>
  );
}

interface Props {
  message: string;
  setMessage: (open: string) => void;
  payload?: Quotation;
}
