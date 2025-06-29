import { fetch } from "@tauri-apps/plugin-http";
import type { ContactListItem, ContactsResponse, Quotation } from "./types";

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

export async function getContacts(
  apiKey: string,
  filter?: string
): Promise<ContactListItem[]> {
  let url = new URL("https://api.lexware.io/v1/contacts");

  url.searchParams.append("customer", "true");
  url.searchParams.append("page", "0");
  url.searchParams.append("size", "20");

  if (filter) {
    url.searchParams.append("name", filter);
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: "Bearer " + apiKey,
    },
  });

  if (response.status >= 200 && response.status < 300) {
    const data: ContactsResponse = await response.json();

    return data.content.map((contact) => {
      const address = contact.addresses?.billing?.[0];

      return {
        id: contact.id,
        name: contact.company?.name ?? contact.person?.lastName ?? "",
        address,
      };
    });
  } else {
    throw new Error(`${await response.text()} (${response.status})`);
  }
}
