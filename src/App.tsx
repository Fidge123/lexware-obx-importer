import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";
import { getVersion } from "@tauri-apps/api/app";
import { openUrl } from "@tauri-apps/plugin-opener";
import { type FormEvent, useEffect, useState } from "react";
import { createQuotation } from "./api.ts";
import { Cog } from "./components/Cog.tsx";
import { ErrorDialog } from "./components/ErrorDialog.tsx";
import { CustomerInput } from "./components/form/CustomerInput.tsx";
import { DropZone } from "./components/form/DropZone.tsx";
import { MultiplierInput } from "./components/form/MultiplierInput.tsx";
import { LineItemsRenderer } from "./components/lineitems/LineItemsRenderer.tsx";
import { SettingsModal } from "./components/SettingsModal.tsx";
import { createPayload } from "./obx.ts";
import type { Address, LineItem, Quotation } from "./types.ts";

export default function App() {
  const [apiKey, setApiKey] = useState(localStorage.getItem("apiKey") || "");
  const [version, setVersion] = useState("");
  const [multiplier, setMultiplier] = useState(1);
  const [grouping, setGrouping] = useState(true);
  const [description, setDescription] = useState(true);
  const [xmlDocs, setXmlDocs] = useState<Record<string, Document>>({});
  const [customer, setCustomer] = useState<Address | undefined>();
  const [payload, setPayload] = useState<Quotation | undefined>();
  const [error, setError] = useState<string>("");
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    void getVersion().then(setVersion);
  }, []);

  useEffect(() => {
    if (Object.keys(xmlDocs).length === 1) {
      setPayload(
        createPayload(
          Object.values(xmlDocs)[0],
          multiplier,
          description,
          grouping,
          customer,
        ),
      );
    } else if (Object.keys(xmlDocs).length > 1) {
      setPayload(
        createPayload(xmlDocs, multiplier, description, grouping, customer),
      );
    } else {
      setPayload(undefined);
    }
  }, [xmlDocs, multiplier, grouping, description, customer]);

  const handleItemDeleted = (index: number) => {
    if (payload) {
      const newPayload = { ...payload };
      newPayload.lineItems = newPayload.lineItems.filter((_, i) => i !== index);
      setPayload(newPayload);
    }
  };

  const handleItemChanged = (index: number, item: LineItem) => {
    if (payload) {
      const newPayload = { ...payload };
      newPayload.lineItems[index] = item;
      setPayload(newPayload);
    }
  };

  async function handleFileSelect(
    content: Promise<string> | string,
    filename: string,
  ) {
    const parser = new DOMParser();
    const parsed = parser.parseFromString(await content, "application/xml");
    setXmlDocs((prev) => ({ ...prev, [filename]: parsed }));
  }

  function handleFileRemove(filename: string) {
    setXmlDocs((prev) => {
      const next = { ...prev };
      delete next[filename];
      return next;
    });
  }

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (payload) {
      createQuotation(payload, apiKey)
        .then((quotationId) => {
          void openUrl(
            `https://app.lexware.de/permalink/quotations/view/${quotationId}`,
          );
          location.reload();
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : String(err));
        });
    } else {
      setError("Keine Daten zum Importieren vorhanden!");
    }
  }

  return (
    <>
      <div className="my-4 flex items-center justify-between">
        <h1 className="font-medium text-3xl">
          Lexware OBX Importer
          <small className="px-2 font-light text-gray-400 text-xs">
            {version}
          </small>
        </h1>
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          className="text-gray-400 transition-colors hover:text-gray-600"
          aria-label="Einstellungen öffnen"
        >
          <Cog />
        </button>
      </div>

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onApiKeyChange={setApiKey}
        onGroupingChange={setGrouping}
        onDescriptionChange={setDescription}
      />

      <form onSubmit={submit} className="w-full max-w-full space-y-2">
        <DropZone
          loadedFiles={Object.keys(xmlDocs)}
          onFileSelect={(c, filename) => void handleFileSelect(c, filename)}
          onFileRemove={handleFileRemove}
        />
        <MultiplierInput onChange={setMultiplier} />
        <CustomerInput onChange={setCustomer} />
        <div className="mt-4 flex justify-end space-x-4">
          <input
            type="reset"
            value="Zurücksetzen"
            className="rounded-md bg-white px-3 py-1.5 font-semibold text-sm shadow transition-all hover:bg-gray-200"
            onClick={() => location.reload()}
          />
          <input
            id="submit"
            type="submit"
            value="Importieren"
            className="rounded-md bg-blue-500 px-3 py-1.5 font-semibold text-sm text-white shadow transition-all hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!apiKey}
          />
        </div>
      </form>
      {payload && (
        <Disclosure as="div" className="max-w-full">
          <DisclosureButton className="text-gray-300 text-sm hover:text-gray-600">
            JSON Vorschau anzeigen
          </DisclosureButton>
          <DisclosurePanel>
            <pre className="max-h-64 overflow-auto rounded border border-gray-300 bg-white p-4 text-xs">
              {JSON.stringify(payload, null, 2)}
            </pre>
          </DisclosurePanel>
        </Disclosure>
      )}
      <LineItemsRenderer
        payload={payload}
        onItemDeleted={handleItemDeleted}
        onItemChanged={handleItemChanged}
      />

      <ErrorDialog message={error} payload={payload} setMessage={setError} />
    </>
  );
}
