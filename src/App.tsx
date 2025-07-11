import { useState, useEffect } from "react";
import { getVersion } from "@tauri-apps/api/app";
import type { Quotation, LineItem, ContactListItem } from "./types.ts";
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
  const [version, setVersion] = useState<string>("");
  const [payload, setPayload] = useState<Quotation | undefined>();
  const [xmlDoc, setXmlDoc] = useState<Document | undefined>();
  const [multiplier, setMultiplier] = useState<number>(1);
  const [grouping, setGrouping] = useState<boolean>(true);
  const [description, setDescription] = useState<boolean>(true);
  const [selectedCustomer, setSelectedCustomer] =
    useState<ContactListItem | null>(null);

  useEffect(() => {
    void getVersion().then(setVersion);
  }, []);

  useEffect(() => {
    if (xmlDoc) {
      setPayload(
        createPayload(
          xmlDoc,
          multiplier,
          description,
          grouping,
          selectedCustomer?.address
        )
      );
    }
  }, [xmlDoc, multiplier, grouping, description, selectedCustomer]);

  const handleMultiplierChange = (value: number) => setMultiplier(value);
  const handleGroupingChange = (value: boolean) => setGrouping(value);
  const handleDescriptionChange = (value: boolean) => setDescription(value);

  const handleCustomerChange = (customer: ContactListItem | null) =>
    setSelectedCustomer(customer);

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
        <MultiplierInput onChange={handleMultiplierChange} />
        <CustomerInput
          value={selectedCustomer}
          onChange={handleCustomerChange}
        />
        <GroupingToggle onChange={handleGroupingChange} />
        <DescriptionToggle onChange={handleDescriptionChange} />
        <div className="formactions">
          <input
            id="submit"
            type="submit"
            value="Importieren"
            disabled={!localStorage.getItem("apiKey")}
          />
        </div>
      </form>
      {/* <pre>{JSON.stringify(payload, null, 2)}</pre> */}
      <LineItemsRenderer
        payload={payload}
        onItemDeleted={handleItemDeleted}
        onItemChanged={handleItemChanged}
      />
    </div>
  );
}
