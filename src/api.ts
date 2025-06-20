import { fetch } from "@tauri-apps/plugin-http";
import { Quotation } from "./types";

interface Response {
  id: string;
  resourceUri: string;
  createdDate: string;
  updatedDate: string;
  version: number;
}

export async function createQuotation(
  quotation: Quotation,
  apiKey: string
): Promise<Response> {
  const response = await fetch("https://api.lexware.io/v1/quotations", {
    method: "POST",
    body: JSON.stringify(quotation),
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + apiKey,
    },
  });
  if (response.status >= 200 && response.status < 300) {
    return response.json();
  } else {
    throw new Error(`${await response.text()} (${response.status})`);
  }
}
