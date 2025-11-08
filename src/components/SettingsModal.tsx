import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { ApiKeyInput } from "./form/ApiKeyInput.tsx";
import { DescriptionToggle } from "./form/DescriptionToggle.tsx";
import { GroupingToggle } from "./form/GroupingToggle.tsx";

export function SettingsModal({
  isOpen,
  onClose,
  onApiKeyChange,
  onGroupingChange,
  onDescriptionChange,
}: Props) {
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
}
