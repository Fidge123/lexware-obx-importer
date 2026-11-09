import { useState } from "react";
import {
  isTelemetryEnabled,
  setTelemetryEnabled,
} from "../../telemetry/telemetry.ts";

export function TelemetryToggle() {
  const [enabled, setEnabled] = useState(isTelemetryEnabled);

  return (
    <>
      <label className="contents text-sm">
        Diagnosedaten senden
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => {
            setTelemetryEnabled(e.target.checked);
            setEnabled(e.target.checked);
          }}
          className="h-4 w-4 justify-self-start"
        />
      </label>
      <p className="col-span-2 text-gray-600 text-xs">
        Es werden Fehler- und Leistungsdaten an den Analysedienst PostHog
        (Server in der EU) übertragen, damit Störungen und langsame Abläufe
        erkannt und behoben werden können. Fehlerberichte enthalten technische
        Details wie Fehlermeldungen und Antworten der Lexware- und
        Köttermann-Schnittstellen und können Kunden- oder Produktnamen
        enthalten. Zusätzlich wird die IP-Adresse übermittelt. Passwörter,
        API-Schlüssel und Tokens werden nie übertragen.
      </p>
    </>
  );
}
