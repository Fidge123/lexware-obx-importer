import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";
import { getVersion } from "@tauri-apps/api/app";
import { openUrl } from "@tauri-apps/plugin-opener";
import { type FormEvent, useEffect, useState } from "react";
import { createQuotation } from "./api.ts";
import { ErrorDialog } from "./components/ErrorDialog.tsx";
import { ApiKeyInput } from "./components/form/ApiKeyInput.tsx";
import { CustomerInput } from "./components/form/CustomerInput.tsx";
import { DescriptionToggle } from "./components/form/DescriptionToggle.tsx";
import { DropZone } from "./components/form/DropZone.tsx";
import { GroupingToggle } from "./components/form/GroupingToggle.tsx";
import { MultiplierInput } from "./components/form/MultiplierInput.tsx";
import { LineItemsRenderer } from "./components/lineitems/LineItemsRenderer.tsx";
import { createPayload } from "./obx.ts";
import type { Address, LineItem, Quotation } from "./types.ts";

export default function App() {
  const [apiKey, setApiKey] = useState(localStorage.getItem("apiKey") || "");
  const [version, setVersion] = useState("");
  const [multiplier, setMultiplier] = useState(1);
  const [grouping, setGrouping] = useState(true);
  const [description, setDescription] = useState(true);
  const [xmlDoc, setXmlDoc] = useState<Document | undefined>();
  const [customer, setCustomer] = useState<Address | undefined>();
  const [payload, setPayload] = useState<Quotation | undefined>();
  const [error, setError] = useState<string>("");

  useEffect(() => {
    void getVersion().then(setVersion);
  }, []);

  useEffect(() => {
    if (xmlDoc) {
      setPayload(
        createPayload(xmlDoc, multiplier, description, grouping, customer),
      );
    }
  }, [xmlDoc, multiplier, grouping, description, customer]);

  const handleItemDeleted = (index: number) => {
    if (payload) {
      const newPayload = { ...payload };
      newPayload.lineItems.splice(index, 1);
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

  async function handleFileSelect(content: Promise<string> | string) {
    const parser = new DOMParser();
    const parsed = parser.parseFromString(await content, "application/xml");
    setXmlDoc(parsed);
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
          setError(`${err}`);
        });
    } else {
      setError("Keine Daten zum Importieren vorhanden!");
    }
  }

  return (
    <>
      <h1 className="my-4 font-medium text-3xl">
        Lexware OBX Importer
        <small className="px-2 font-light text-gray-400 text-xs">
          {version}
        </small>
      </h1>

      <form onSubmit={submit} className="w-full max-w-full space-y-2">
        <DropZone onFileSelect={(c) => void handleFileSelect(c)} />
        <ApiKeyInput onChange={setApiKey} />
        <MultiplierInput onChange={setMultiplier} />
        <CustomerInput onChange={setCustomer} />
        <GroupingToggle onChange={setGrouping} />
        <DescriptionToggle onChange={setDescription} />
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
