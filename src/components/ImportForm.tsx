import React from "react";
import type { Quotation } from "../types";

interface ImportFormProps {
  apiKey: string;
  onApiKeyChange: (apiKey: string) => void;
  payload?: Quotation;
  onSubmit: (formData: ImportFormData) => void;
}

export interface ImportFormData {
  apiKey: string;
  markup: number;
  customer: string;
  groupSimilarItems: boolean;
  descriptionFormat: "short" | "long";
}

export function ImportForm({
  apiKey,
  onApiKeyChange,
  onSubmit,
}: ImportFormProps) {
  const [markup, setMarkup] = React.useState<number>(0);
  const [customer, setCustomer] = React.useState<string>("");
  const [groupSimilarItems, setGroupSimilarItems] =
    React.useState<boolean>(true);
  const [descriptionFormat, setDescriptionFormat] = React.useState<
    "short" | "long"
  >("long");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit({
      apiKey,
      markup,
      customer,
      groupSimilarItems,
      descriptionFormat,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>
        API Key
        <input
          type="text"
          value={apiKey}
          onChange={(e) => onApiKeyChange(e.target.value)}
        />
      </label>

      <label>
        Aufschlag in %
        <input
          type="number"
          value={markup}
          onChange={(e) => setMarkup(Number(e.target.value))}
        />
      </label>

      <label>
        Kunde
        <div className="customer-select-container">
          <input
            type="text"
            placeholder="Testkunde"
            autoComplete="off"
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
          />
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
        <select
          value={groupSimilarItems ? "y" : "n"}
          onChange={(e) => setGroupSimilarItems(e.target.value === "y")}
        >
          <option value="y">Gruppiert (eine Zeile mit Stückzahl &gt; 1)</option>
          <option value="n">
            Nicht Gruppiert (je eine Zeile mit Stückzahl = 1)
          </option>
        </select>
      </label>

      <label>
        Beschreibungen
        <select
          value={descriptionFormat}
          onChange={(e) =>
            setDescriptionFormat(e.target.value as "short" | "long")
          }
        >
          <option value="short">Kurzform in Beschreibung des Produkts</option>
          <option value="long">Langform in extra Zeile(n)</option>
        </select>
      </label>

      <div className="formactions">
        <input type="submit" value="Importieren" disabled={!apiKey} />
      </div>
    </form>
  );
}
