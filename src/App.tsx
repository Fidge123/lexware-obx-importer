import { useState, useEffect, type FormEvent } from "react";
import { getVersion } from "@tauri-apps/api/app";
import { openUrl } from "@tauri-apps/plugin-opener";
import type { Quotation, LineItem, Address } from "./types.ts";
import { LineItemsRenderer } from "./components/lineitems/LineItemsRenderer.tsx";
import { DropZone } from "./components/form/DropZone.tsx";
import { createPayload } from "./obx.ts";
import { ApiKeyInput } from "./components/form/ApiKeyInput.tsx";
import { MultiplierInput } from "./components/form/MultiplierInput.tsx";
import { CustomerInput } from "./components/form/CustomerInput.tsx";
import { GroupingToggle } from "./components/form/GroupingToggle.tsx";
import { DescriptionToggle } from "./components/form/DescriptionToggle.tsx";
import { createQuotation } from "./api.ts";
import { Error } from "./components/Error.tsx";
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";

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
      <h1 className="text-3xl font-medium my-4">
        Lexware OBX Importer
        <small className="text-xs font-light text-gray-400 px-2">
          {version}
        </small>
      </h1>

      <form onSubmit={submit} className="space-y-2 max-w-full w-full">
        <DropZone onFileSelect={(c) => void handleFileSelect(c)} />
        <ApiKeyInput onChange={setApiKey} />
        <MultiplierInput onChange={setMultiplier} />
        <CustomerInput onChange={setCustomer} />
        <GroupingToggle onChange={setGrouping} />
        <DescriptionToggle onChange={setDescription} />
        <div className="flex justify-end mt-4 space-x-4">
          <input
            type="reset"
            value="Zurücksetzen"
            className="bg-white text-sm py-1.5 px-3 rounded-md shadow font-semibold hover:bg-gray-200 transition-all"
            onClick={() => location.reload()}
          />
          <input
            id="submit"
            type="submit"
            value="Importieren"
            className="bg-blue-500 text-white text-sm py-1.5 px-3 rounded-md shadow font-semibold hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!apiKey}
          />
        </div>
      </form>
      {payload && (
        <Disclosure as="div" className="max-w-full">
          <DisclosureButton className="text-gray-300 hover:text-gray-600 text-sm">
            JSON Vorschau anzeigen
          </DisclosureButton>
          <DisclosurePanel>
            <pre className="text-xs overflow-auto max-h-64 bg-white rounded border border-gray-300 p-4 ">
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

      <Error message={error} payload={payload} setMessage={setError} />
    </>
  );
}
