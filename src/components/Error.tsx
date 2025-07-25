import {
  Description,
  Dialog,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { Quotation } from "../types";

export function Error({ message, setMessage, payload }: Props) {
  return (
    <Dialog
      open={message !== ""}
      onClose={() => setMessage("")}
      className="relative z-50"
    >
      <div className="fixed inset-0 flex w-screen items-center justify-center p-4 bg-gray-500/30">
        <DialogPanel className="max-w-2xl space-y-4 border bg-white p-12 rounded-xl drop-shadow-lg max-h-2xl">
          <DialogTitle className="font-bold">
            Ein Fehler ist aufgetreten!
          </DialogTitle>
          <Description>{message}</Description>
          <pre className="text-xs overflow-auto max-h-64 empty:hidden bg-gray-100 rounded border-gray-300 p-4">
            {JSON.stringify(payload, null, 2)}
          </pre>
          <button
            onClick={() => setMessage("")}
            className="border rounded-lg bg-blue-500 text-white px-4 py-2 hover:bg-blue-600 transition-colors"
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
