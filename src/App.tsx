import { useState, useEffect } from "react";
import { getVersion } from "@tauri-apps/api/app";
import type { Quotation, LineItem } from "./types.ts";
import { LineItemsRenderer } from "./components/LineItemsRenderer.tsx";

export default function App() {
  const [version, setVersion] = useState<string>("");
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

  return (
    <div>
      <h1>
        Lexware OBX Importer
        <small>{version}</small>
      </h1>

      <form>
        <div id="dropZone">
          <p>Drag & Drop oder anklicken</p>
        </div>
        <input
          type="file"
          accept=".obx,application/obx+xml"
          style={{ display: "none" }}
        />

        <label>
          API Key
          <input
            type="text"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
        </label>

        <label>
          Aufschlag in %
          <input type="number" defaultValue="0" />
        </label>

        <label>
          Kunde
          <div className="customer-select-container">
            <input type="text" placeholder="Testkunde" autoComplete="off" />
            <div className="customer-dropdown">
              <div className="loading-indicator" style={{ display: "none" }}>
                Lädt...
              </div>
              <ul></ul>
            </div>
          </div>
        </label>

        <label>
          Produkte mit gleichem Preis und Text
          <select defaultValue="y">
            <option value="y">
              Gruppiert (eine Zeile mit Stückzahl &gt; 1)
            </option>
            <option value="n">
              Nicht Gruppiert (je eine Zeile mit Stückzahl = 1)
            </option>
          </select>
        </label>

        <label>
          Beschreibungen
          <select defaultValue="long">
            <option value="short">Kurzform in Beschreibung des Produkts</option>
            <option value="long">Langform in extra Zeile(n)</option>
          </select>
        </label>

        <div className="formactions">
          <input
            type="submit"
            value="Importieren"
            disabled={!payload || !apiKey}
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
