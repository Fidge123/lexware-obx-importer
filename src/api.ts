import { fetch } from "@tauri-apps/plugin-http";
import type { Address, ContactsResponse, Quotation } from "./types";

export async function kmLogin(
  username: string,
  password: string,
  fetchFn = fetch,
): Promise<string> {
  const response = await fetchFn(
    "https://koettermann.iw-erp.de/api/logins?downgrade=1",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ login: { username, password } }),
    },
  );
  if (!response.ok) {
    throw new Error(`Km login failed (${response.status})`);
  }
  const data = (await response.json()) as { sessionid: string };
  return data.sessionid;
}

export async function kmShippingPrice(
  sessionToken: string,
  zip: string,
  volume_m3: number,
  fetchFn = fetch,
): Promise<number> {
  const response = await fetchFn(
    `https://koettermann.iw-erp.de/api/invoice/shipping_price/calculate/DE/${zip}/shipping-volume?quantity=${volume_m3}`,
    {
      method: "GET",
      headers: {
        "x-session-token": sessionToken,
      },
    },
  );
  if (!response.ok)
    throw new Error(`Km price fetch failed (${response.status})`);
  const data = (await response.json()) as { netto_value: number };
  return data.netto_value;
}

export async function createQuotation(
  quotation: Quotation,
  apiKey: string,
  fetchFn = fetch,
): Promise<string> {
  const response = await fetchFn("https://api.lexware.io/v1/quotations", {
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
  fetchFn = fetch,
): Promise<Address[]> {
  const url = new URL("https://api.lexware.io/v1/contacts");

  url.searchParams.append("customer", "true");
  url.searchParams.append("page", "0");
  url.searchParams.append("size", "20");

  if (filter) {
    url.searchParams.append("name", filter);
  }

  const response = await fetchFn(url.toString(), {
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
