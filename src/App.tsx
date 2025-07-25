import { useState, useEffect, type FormEvent } from "react";
import { getVersion } from "@tauri-apps/api/app";
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

export default function App() {
  const [apiKey, setApiKey] = useState(localStorage.getItem("apiKey") || "");
  const [version, setVersion] = useState("");
  const [multiplier, setMultiplier] = useState(1);
  const [grouping, setGrouping] = useState(true);
  const [description, setDescription] = useState(true);
  const [xmlDoc, setXmlDoc] = useState<Document | undefined>();
  const [customer, setCustomer] = useState<Address | undefined>();
  const [payload, setPayload] = useState<Quotation | undefined>();

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
      void (async () => {
        await createQuotation(payload, apiKey);
      })();
    }
  }

  return (
    <>
      <h1 className="text-3xl font-medium my-6">
        Lexware OBX Importer
        <small className="text-xs font-light text-gray-400 px-2">
          {version}
        </small>
      </h1>

      <form onSubmit={submit} className="space-y-4 max-w-full w-full">
        <DropZone onFileSelect={(c) => void handleFileSelect(c)} />
        <ApiKeyInput onChange={setApiKey} />
        <MultiplierInput onChange={setMultiplier} />
        <CustomerInput onChange={setCustomer} />
        <GroupingToggle onChange={setGrouping} />
        <DescriptionToggle onChange={setDescription} />
        <div className="flex justify-end mt-6">
          <input
            id="submit"
            type="submit"
            value="Importieren"
            className="bg-blue-500 text-white text-sm py-1.5 px-3 rounded-md shadow font-semibold hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!apiKey}
          />
        </div>
      </form>
      <pre>{JSON.stringify(payload, null, 2)}</pre>
      <LineItemsRenderer
        payload={payload}
        onItemDeleted={handleItemDeleted}
        onItemChanged={handleItemChanged}
      />
    </>
  );
}
