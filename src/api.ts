import { fetch } from "@tauri-apps/plugin-http";
import type { Address, ContactsResponse, Quotation } from "./types";

export async function createQuotation(
  quotation: Quotation,
  apiKey: string,
): Promise<string> {
  const response = await fetch("https://api.lexware.io/v1/quotations", {
    method: "POST",
    body: JSON.stringify(quotation),
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
  });
  if (response.status >= 200 && response.status < 300) {
    return (await response.json()).id as string;
  } else {
    throw new Error(`${await response.text()} (${response.status})`);
  }
}

export async function getContacts(
  apiKey: string,
  filter?: string,
): Promise<Address[]> {
  const url = new URL("https://api.lexware.io/v1/contacts");

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
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (response.status >= 200 && response.status < 300) {
    const data = (await response.json()) as ContactsResponse;

    return data.content.map((contact) => {
      const address = contact.addresses?.billing?.[0];

      return {
        contactId: contact.id,
        name:
          contact.company?.name ??
          `${contact.person?.firstName} ${contact.person?.lastName}`.trim(),
        countryCode: "DE",
        ...address,
      };
    });
  } else {
    throw new Error(`${await response.text()} (${response.status})`);
  }
}
