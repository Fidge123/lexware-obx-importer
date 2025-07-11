import { useState, useEffect } from "react";
import { getVersion } from "@tauri-apps/api/app";
import type { Quotation, LineItem } from "./types.ts";
import { LineItemsRenderer } from "./components/LineItemsRenderer.tsx";
import { DropZone } from "./components/DropZone.tsx";
import { createPayload } from "./obx.ts";
import { ApiKeyInput } from "./components/form/ApiKeyInput.tsx";
import { MultiplierInput } from "./components/form/MultiplierInput.tsx";
import { CustomerInput } from "./components/form/CustomerInput.tsx";
import { GroupingToggle } from "./components/form/GroupingToggle.tsx";
import { DescriptionToggle } from "./components/form/DescriptionToggle.tsx";

export default function App() {
  const [version, setVersion] = useState<string>("");
  const [payload, setPayload] = useState<Quotation | undefined>();

  useEffect(() => {
    void getVersion().then(setVersion);
  }, []);

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
    // const mult = 1 + aufschlag / 100;
    const parser = new DOMParser();
    const parsed = parser.parseFromString(await content, "application/xml");

    setPayload(
      createPayload(
        parsed,
        1,
        true,
        true
        // mult,
        // longSelect?.value === "long",
        // groupSelect?.value === "y",
      )
    );

    // if (payload && apiKey && submitButton) {
    //   submitButton.disabled = false;
    // }
  };

  // const handleFormSubmit = (formData: ImportFormData) => {
  //   // TODO: Implement import logic using the form data
  //   console.log("Form submitted with data:", formData);
  // };

  return (
    <div>
      <h1>
        Lexware OBX Importer
        <small>{version}</small>
      </h1>

      <form onSubmit={() => null}>
        <DropZone onFileSelect={handleFileSelect} />

        <ApiKeyInput />
        <MultiplierInput />
        <CustomerInput />
        <GroupingToggle />
        <DescriptionToggle />

        <div className="formactions">
          <input
            id="submit"
            type="submit"
            value="Importieren"
            disabled={!localStorage.getItem("apiKey")}
          />
        </div>
      </form>

      <LineItemsRenderer
        payload={payload}
        onItemDeleted={handleItemDeleted}
        onItemChanged={handleItemChanged}
      />
    </div>
  );
}
