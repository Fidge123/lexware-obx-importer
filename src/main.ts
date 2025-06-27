import { createPayload } from "./obx.ts";
import { listen } from "./util.ts";
import { getVersion } from "@tauri-apps/api/app";
import { readTextFile } from "@tauri-apps/plugin-fs";
import { openUrl } from "@tauri-apps/plugin-opener";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { Quotation } from "./types.ts";
import { createQuotation, getContacts } from "./api.ts";
import { LineItemsRenderer } from "./components/LineItemsRenderer.ts";

getVersion().then((appVersion) => {
  document.querySelector("#version")!.textContent = appVersion;
});

const dropText: HTMLParagraphElement | null =
  document.querySelector("#dropText");
const originalDropText = dropText?.textContent || "Datei auswählen";
const preview: HTMLPreElement | null = document.querySelector("#preview");
const lineItemsContainer: HTMLElement | null = document.querySelector(
  "#line-items-container"
);
const lineItemsList: HTMLElement | null =
  document.querySelector("#line-items-list");
const apiKeyInput: HTMLInputElement | null = document.querySelector("#apiKey");
const fileUpload: HTMLInputElement | null = document.querySelector("#obx");
const longSelect: HTMLSelectElement | null = document.querySelector("#isLong");
const groupSelect: HTMLSelectElement | null = document.querySelector("#group");
const aufschlagInput: HTMLInputElement | null =
  document.querySelector("#aufschlag");
const submitButton: HTMLInputElement | null = document.querySelector("#submit");
const customerInput: HTMLInputElement | null =
  document.querySelector("#customer");
const customerDropdown: HTMLElement | null =
  document.querySelector("#customer-dropdown");
const customerList: HTMLUListElement | null =
  document.querySelector("#customer-list");
const loadingIndicator: HTMLElement | null =
  document.querySelector(".loading-indicator");

let payload: Quotation | undefined;
let apiKey = localStorage.getItem("apiKey") ?? "";
let selectedContactId: string | null = null;
let debounceTimer: NodeJS.Timeout | null = null;

// Initialize Line Items Renderer
let lineItemsRenderer: LineItemsRenderer | null = null;
if (lineItemsContainer && lineItemsList) {
  lineItemsRenderer = new LineItemsRenderer(lineItemsContainer, lineItemsList, {
    onItemDeleted: (index: number) => {
      if (payload) {
        payload.lineItems.splice(index, 1);
        lineItemsRenderer?.render(payload);
      }
    },
    onItemChanged: (_index: number, _item: any) => {
      // Item is already updated by reference, no need to do anything
    },
  });
}

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
  if (payload) {
    if (selectedContactId) {
      payload.address = { contactId: selectedContactId };
    } else if (customerInput?.value) {
      payload.address = {
        name: customerInput.value,
        countryCode: "DE",
      };
    }

    // Use the line items renderer
    lineItemsRenderer?.render(payload);

    // Hide old preview and show line items
    if (preview) {
      preview.style.display = "none";
    }
  } else {
    // Clear line items if no payload
    lineItemsRenderer?.clear();
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
    if (selectedContactId) {
      payload.address = { contactId: selectedContactId };
    } else if (customerInput?.value) {
      payload.address = {
        name: customerInput.value,
        countryCode: "DE",
      };
    }

    try {
      const data = await createQuotation(payload, apiKey);
      dropText!.textContent = originalDropText;
      payload = undefined;
      lineItemsRenderer?.clear();
      (ev.target as HTMLInputElement).disabled = true;
      if (data.id) {
        await openUrl(
          `https://app.lexware.de/permalink/quotations/view/${data.id}`
        );
      }
    } catch (error: any) {
      dropText!.textContent =
        "Fehler: " + (error?.message ?? JSON.stringify(error));
    }
  }
}

if (customerInput) {
  customerInput.addEventListener("focus", async () => {
    if (apiKey) {
      showCustomerDropdown();
      await fetchAndDisplayCustomers();
    }
  });

  customerInput.addEventListener("input", () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    debounceTimer = setTimeout(() => {
      selectedContactId = null;
      updatePreview();
      fetchAndDisplayCustomers();
    }, 300);
  });

  document.addEventListener("click", (event) => {
    if (
      event.target !== customerInput &&
      event.target !== customerDropdown &&
      !customerDropdown?.contains(event.target as Node)
    ) {
      hideCustomerDropdown();
    }
  });
}

async function fetchAndDisplayCustomers(): Promise<void> {
  if (!customerList || !loadingIndicator || !apiKey) {
    return;
  }

  try {
    customerList.innerHTML = "";
    const filter = customerInput?.value.trim();

    loadingIndicator.style.display = "block";
    const customers = await getContacts(
      apiKey,
      filter && filter.length >= 3 ? filter : undefined
    );
    loadingIndicator.style.display = "none";

    if (customers.length === 0) {
      const li = document.createElement("li");
      li.textContent = "Keine Ergebnisse gefunden";
      customerList.appendChild(li);
    } else if (
      customers.length === 1 &&
      selectedContactId === customers[0].id
    ) {
      hideCustomerDropdown();
      return;
    } else {
      customers.forEach((customer) => {
        const li = document.createElement("li");
        li.textContent = customer.name;
        li.dataset.id = customer.id;

        li.addEventListener("click", () => {
          if (customerInput) {
            customerInput.value = customer.name;
            selectedContactId = customer.id;
            updatePreview();
            hideCustomerDropdown();
          }
        });

        customerList.appendChild(li);
      });
    }
  } catch (error) {
    console.error("Error fetching customers:", error);
    loadingIndicator.style.display = "none";

    const li = document.createElement("li");
    li.textContent = "Fehler beim Laden der Kunden";
    customerList.appendChild(li);
  }
}

function showCustomerDropdown(): void {
  customerDropdown?.classList.add("active");
}

function hideCustomerDropdown(): void {
  customerDropdown?.classList.remove("active");
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
