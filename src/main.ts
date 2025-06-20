import { createPayload } from "./obx.ts";
import { listen } from "./util.ts";
import { getVersion } from "@tauri-apps/api/app";
import { readTextFile } from "@tauri-apps/plugin-fs";
import { openUrl } from "@tauri-apps/plugin-opener";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { Quotation } from "./types.ts";
import { createQuotation } from "./api.ts";

getVersion().then((appVersion) => {
  document.querySelector("#version")!.textContent = appVersion;
});

const dropText: HTMLParagraphElement | null =
  document.querySelector("#dropText");
const originalDropText = dropText?.textContent || "Datei auswählen";
const preview: HTMLPreElement | null = document.querySelector("#preview");
const apiKeyInput: HTMLInputElement | null = document.querySelector("#apiKey");
const fileUpload: HTMLInputElement | null = document.querySelector("#obx");
const longSelect: HTMLSelectElement | null = document.querySelector("#isLong");
const groupSelect: HTMLSelectElement | null = document.querySelector("#group");
const aufschlagInput: HTMLInputElement | null =
  document.querySelector("#aufschlag");
const submitButton: HTMLInputElement | null = document.querySelector("#submit");

let payload: Quotation | undefined;
let apiKey = localStorage.getItem("apiKey") ?? "";

if (apiKeyInput) {
  apiKeyInput.value = apiKey;
  apiKeyInput.addEventListener("change", (ev) => {
    if (ev.target instanceof HTMLInputElement) {
      apiKey = ev.target.value;
      localStorage.setItem("apiKey", apiKey);

      if (apiKey && payload && submitButton) {
        submitButton.disabled = false;
      }
    }
  });
}

listen("#dropZone", "click", () => fileUpload?.click());
listen("#dropZone", "drop", (ev) => ev.preventDefault());
listen("#dropZone", "dragover", (ev) => ev.preventDefault());

async function processFile() {
  const file = fileUpload?.files?.[0];
  if (file) {
    await handleFileUpload(file.name, file.text());
  }
  updatePreview();
}

function updatePreview() {
  if (preview) {
    preview.textContent = JSON.stringify(payload, null, 2);
  }
}

fileUpload?.addEventListener("change", processFile);
aufschlagInput?.addEventListener("change", processFile);
longSelect?.addEventListener("change", processFile);
groupSelect?.addEventListener("change", processFile);

getCurrentWebview().onDragDropEvent((ev) => {
  if (ev.payload.type === "over" && dropText) {
    dropText.textContent = "+";
  } else if (ev.payload.type === "drop") {
    handleFileUpload(
      ev.payload.paths[0]?.split("/").pop() || "Dateiname unbekannt",
      readTextFile(ev.payload.paths[0])
    );
    updatePreview();
  } else {
    if (dropText) {
      dropText.textContent = originalDropText;
    }
  }
});

listen("#submit", "click", (ev) => submit(ev));

async function submit(ev: Event) {
  ev.preventDefault();

  if (!payload || !apiKey) {
    dropText!.textContent =
      "Bitte laden Sie eine Datei hoch und geben Sie Ihren API-Schlüssel ein.";
  } else {
    try {
      const data = await createQuotation(payload, apiKey);
      dropText!.textContent = originalDropText;
      payload = undefined;
      (ev.target as HTMLInputElement).disabled = true;
      if (data.id) {
        await openUrl(
          `https://app.lexware.de/permalink/quotations/edit/${data.id}`
        );
      }
    } catch (error: any) {
      dropText!.textContent =
        "Fehler: " + (error?.message ?? JSON.stringify(error));
    }
  }
}

async function handleFileUpload(
  name: string,
  content: Promise<string> | string
) {
  const mult = 1 + parseFloat(aufschlagInput?.value ?? "0") / 100;
  const parser = new DOMParser();
  const parsed = parser.parseFromString(await content, "application/xml");

  payload = createPayload(
    parsed,
    mult,
    longSelect?.value === "long",
    groupSelect?.value === "y"
  );

  if (payload && apiKey && submitButton) {
    submitButton.disabled = false;
  }

  if (dropText) {
    dropText.textContent = name;
  }
}
