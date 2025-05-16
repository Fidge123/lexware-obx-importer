import { createPayload } from "./obx.ts";
import { fetch } from "@tauri-apps/plugin-http";

const dropZone: HTMLDivElement | null = document.querySelector("#dropZone");
const dropText: HTMLParagraphElement | null =
  document.querySelector("#dropText");
const preview: HTMLPreElement | null = document.querySelector("#preview");
const apiKeyInput: HTMLInputElement | null = document.querySelector("#apiKey");
const fileUpload: HTMLInputElement | null = document.querySelector("#obx");
const aufschlagInput: HTMLInputElement | null =
  document.querySelector("#aufschlag");

let shortPayload: string;
let longPayload: string;
let apiKey = localStorage.getItem("apiKey") ?? "";

if (apiKeyInput) {
  apiKeyInput.value = apiKey;
  apiKeyInput.addEventListener("change", (ev) => {
    if (ev.target instanceof HTMLInputElement) {
      apiKey = ev.target.value;
      localStorage.setItem("apiKey", apiKey);
    }
  });
}

fileUpload?.addEventListener("change", () => {
  const file = fileUpload.files?.[0];
  if (file) {
    handleFileUpload(file);
  }
});

aufschlagInput?.addEventListener("change", () => {
  const file = fileUpload?.files?.[0];
  if (file) {
    handleFileUpload(file);
  }
});

dropZone?.addEventListener("click", () => fileUpload?.click());

dropZone?.addEventListener("drop", (ev) => {
  ev.preventDefault();

  if (ev.dataTransfer?.items) {
    const item = ev.dataTransfer?.items[0];
    if (item.kind === "file") {
      handleFileUpload(item.getAsFile()!);
    }
  } else if (ev.dataTransfer?.files) {
    handleFileUpload(ev.dataTransfer?.files[0]);
  }
});

dropZone?.addEventListener("dragover", (ev) => {
  ev.preventDefault();
});

document.querySelector("#showPreview")?.addEventListener("click", (ev) => {
  ev.preventDefault();
  if (preview) {
    preview.textContent = JSON.stringify(JSON.parse(longPayload), null, 2);
  }
});

document
  .querySelector("#submit_short")
  ?.addEventListener("click", (ev) => submit(shortPayload)(ev));
document
  .querySelector("#submit_long")
  ?.addEventListener("click", (ev) => submit(longPayload)(ev));

function submit(payload: string) {
  return (ev: Event) => {
    ev.preventDefault();
    fetch("https://api.lexoffice.io/v1/quotations", {
      method: "POST",
      body: payload,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: "Bearer " + apiKey,
      },
    });
    // }).then(() => location.reload());
  };
}

async function handleFileUpload(file: File) {
  const mult = 1 + parseFloat(aufschlagInput?.value ?? "0") / 100;
  const parser = new DOMParser();
  const parsed = parser.parseFromString(await file.text(), "application/xml");

  shortPayload = createPayload(parsed, mult, false);
  longPayload = createPayload(parsed, mult, true);

  if (dropText) {
    dropText.textContent = file.name;
  }
}
