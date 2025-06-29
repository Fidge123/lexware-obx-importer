import { useState, useEffect } from "react";
import { getVersion } from "@tauri-apps/api/app";
import type { Quotation, LineItem } from "./types.ts";
import { LineItemsRenderer } from "./components/LineItemsRenderer.tsx";
import { DropZone } from "./components/DropZone.tsx";
import { createPayload } from "./obx.ts";
import { BasicFormInput } from "./components/BasicFormInput.tsx";

export default function App() {
  const [version, setVersion] = useState<string>("");
  const [aufschlag, setAufschlag] = useState(0);
  const [customer, setCustomer] = useState<string>("");
  const [apiKey, setApiKey] = useState<string>(
    localStorage.getItem("apiKey") ?? ""
  );
  const [payload, setPayload] = useState<Quotation | undefined>();
  const [_selectedContactId, _setSelectedContactId] = useState<string | null>(
    null
  );

  useEffect(() => {
    getVersion().then(setVersion);
  }, []);

  useEffect(() => {
    localStorage.setItem("apiKey", apiKey);
  }, [apiKey]);

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

  const handleFileSelect = async (content: Promise<string> | string) => {
    const mult = 1 + aufschlag / 100;
    const parser = new DOMParser();
    const parsed = parser.parseFromString(await content, "application/xml");

    setPayload(
      createPayload(
        parsed,
        mult,
        longSelect?.value === "long",
        groupSelect?.value === "y"
      )
    );

    // if (payload && apiKey && submitButton) {
    //   submitButton.disabled = false;
    // }
  };

  const handleFormSubmit = (formData: ImportFormData) => {
    // TODO: Implement import logic using the form data
    console.log("Form submitted with data:", formData);
  };

  return (
    <div>
      <h1>
        Lexware OBX Importer
        <small>{version}</small>
      </h1>

      <DropZone onFileSelect={handleFileSelect} />

      <BasicFormInput name="API Key" value={apiKey} setValue={setApiKey} />
      <BasicFormInput
        name="Aufschlag in %"
        type="number"
        value={aufschlag}
        setValue={setAufschlag}
      />
      <BasicFormInput
        name="Kunde"
        value={customer}
        setValue={setCustomer}
        placeholder="Testkunde"
      />

      <LineItemsRenderer
        payload={payload}
        onItemDeleted={handleItemDeleted}
        onItemChanged={handleItemChanged}
      />
    </div>
  );
}
