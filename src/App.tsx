import { useState, useEffect } from "react";
import { getVersion } from "@tauri-apps/api/app";
import type { Quotation, LineItem } from "./types.ts";
import { LineItemsRenderer } from "./components/lineitems/LineItemsRenderer.tsx";
import { DropZone } from "./components/form/DropZone.tsx";
import { createPayload } from "./obx.ts";
import { ApiKeyInput } from "./components/form/ApiKeyInput.tsx";
import { MultiplierInput } from "./components/form/MultiplierInput.tsx";
import { GroupingToggle } from "./components/form/GroupingToggle.tsx";
import { DescriptionToggle } from "./components/form/DescriptionToggle.tsx";
import { createQuotation } from "./api.ts";

export default function App() {
  const [version, setVersion] = useState<string>("");
  const [payload, setPayload] = useState<Quotation | undefined>();
  const [xmlDoc, setXmlDoc] = useState<Document | undefined>();
  const [multiplier, setMultiplier] = useState<number>(0);
  const [grouping, setGrouping] = useState<boolean>(true);
  const [description, setDescription] = useState<boolean>(true);

  useEffect(() => {
    void getVersion().then(setVersion);
  }, []);

  useEffect(() => {
    if (xmlDoc) {
      setPayload(
        createPayload(xmlDoc, 1 + multiplier / 100, description, grouping)
      );
    }
  }, [xmlDoc, multiplier, grouping, description]);

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

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const apiKey = localStorage.getItem("apiKey") || "";
    if (payload) {
      void (async () => {
        await createQuotation(payload, apiKey);
      })();
    }
  }

  return (
    <div>
      <h1>
        Lexware OBX Importer
        <small>{version}</small>
      </h1>

      <form onSubmit={submit}>
        <DropZone onFileSelect={(c) => void handleFileSelect(c)} />

        <ApiKeyInput />
        <MultiplierInput onChange={(value) => setMultiplier(value)} />
        {/* <CustomerInput /> */}
        <GroupingToggle onChange={(value) => setGrouping(value)} />
        <DescriptionToggle onChange={(value) => setDescription(value)} />

        <div className="formactions">
          <input
            id="submit"
            type="submit"
            value="Importieren"
            disabled={!localStorage.getItem("apiKey")}
          />
        </div>
      </form>
      <pre>{JSON.stringify(payload, null, 2)}</pre>
      <LineItemsRenderer
        payload={payload}
        onItemDeleted={handleItemDeleted}
        onItemChanged={handleItemChanged}
      />
    </div>
  );
}
