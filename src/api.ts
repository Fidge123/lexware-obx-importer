import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import type { Address, ContactsResponse, Quotation } from "./types";

type FetchFn = typeof globalThis.fetch;

const KOETTERMANN_BUILD_PARAMS =
  "iw-build-id=2026033003&iw-package-id=customer_erp_ui";

export async function koettermannLogin(
  username: string,
  password: string,
  fetchFn: FetchFn = tauriFetch as unknown as FetchFn,
): Promise<string> {
  const response = await fetchFn(
    `https://koettermann.iw-erp.de/api/logins?downgrade=1&tokenIdentifiers=iw-mqtt-native%2Ciw-external&validSeconds=86400&${KOETTERMANN_BUILD_PARAMS}`,
    {
      method: "POST",
      body: JSON.stringify({ login: { username, password } }),
      headers: {
        "Content-Type": "application/json",
        "x-iw-convert-to-camel-case": "1",
      },
    },
  );
  if (!response.ok)
    throw new Error(`Koettermann login failed (${response.status})`);
  const data = (await response.json()) as { sessionid: string };
  return data.sessionid;
}

export async function koettermannShippingPrice(
  sessionToken: string,
  countryCode: string,
  zip: string,
  volume_m3: number,
  fetchFn: FetchFn = tauriFetch as unknown as FetchFn,
): Promise<number> {
  const response = await fetchFn(
    `https://koettermann.iw-erp.de/api/invoice/shipping_price/calculate/${countryCode}/${zip}/shipping-volume?quantity=${volume_m3}&${KOETTERMANN_BUILD_PARAMS}`,
    {
      method: "GET",
      headers: {
        "x-session-token": sessionToken,
        "x-iw-convert-to-camel-case": "1",
      },
    },
  );
  if (!response.ok)
    throw new Error(`Koettermann price fetch failed (${response.status})`);
  const data = (await response.json()) as { nettoValue: number };
  return data.nettoValue;
}

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
