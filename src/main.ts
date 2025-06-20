import { createPayload } from "./obx.ts";
import { listen } from "./util.ts";
import { fetch } from "@tauri-apps/plugin-http";
import { getVersion } from "@tauri-apps/api/app";
import { readTextFile } from "@tauri-apps/plugin-fs";
import { openUrl } from "@tauri-apps/plugin-opener";
import { getCurrentWebview } from "@tauri-apps/api/webview";

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

let payload = "{}";
let apiKey = localStorage.getItem("apiKey") ?? "";

if (apiKeyInput) {
  apiKeyInput.value = apiKey;
  apiKeyInput.addEventListener("change", (ev) => {
    if (ev.target instanceof HTMLInputElement) {
      apiKey = ev.target.value;
      localStorage.setItem("apiKey", apiKey);

      if (apiKey && payload) {
        (document.getElementById("submit") as HTMLInputElement).disabled =
          false;
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
    preview.textContent = JSON.stringify(JSON.parse(payload), null, 2);
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

listen("#submit", "click", (ev) => submit(payload)(ev));

function submit(payload: string) {
  return async (ev: Event) => {
    ev.preventDefault();
    try {
      const response = await fetch("https://api.lexware.io/v1/quotations", {
        method: "POST",
        body: payload,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: "Bearer " + apiKey,
        },
      });

      if (response.status >= 200 || response.status < 300) {
        dropText!.textContent = originalDropText;
        const data = await response.json();
        payload = "";
        (ev.target as HTMLInputElement).disabled = true;
        await openUrl(
          `https://app.lexware.de/permalink/quotations/edit/${data.id}`
        );
      } else {
        response.text().then((text) => {
          dropText!.textContent = "Fehler: " + text;
        });
      }
    } catch (error: any) {
      dropText!.textContent =
        "Fehler: " + (error?.message ?? JSON.stringify(error));
    }
  };
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

  if (payload && apiKey) {
    (document.getElementById("submit") as HTMLInputElement).disabled = false;
  }

  if (dropText) {
    dropText.textContent = name;
  }
}
