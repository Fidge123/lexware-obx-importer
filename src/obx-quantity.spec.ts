import { expect, test } from "bun:test";
import { DOMParser } from "@xmldom/xmldom";
import xpath from "xpath";

import { createPayload } from "./obx.ts";
import type { CustomLineItem, TextLineItem } from "./types.ts";

const x = xpath as unknown as XPathEvaluator;

function parseXml(xml: string): Document {
  return new DOMParser().parseFromString(
    xml,
    "application/xml",
  ) as unknown as Document;
}

function article(artNr: string, price: string, quantity?: string): string {
  return `<bskArticle>
    <artNr type="final">${artNr}</artNr>
    <description type="short"><text lang="de">Artikel</text></description>
    <description type="features"><text lang="de">Merkmale ${artNr}</text></description>
    ${quantity ? `<quantity count="${quantity}"/>` : ""}
    <itemPrice type="sale" pd="1" value="${price}" currency="EUR"/>
  </bskArticle>`;
}

function customItems(lineItems: unknown[]): CustomLineItem[] {
  return lineItems.filter(
    (item): item is CustomLineItem =>
      (item as CustomLineItem).type === "custom" &&
      (item as CustomLineItem).name !== "Frachtkosten und Verbringung",
  );
}

test("line items take their quantity from the obx", () => {
  const doc = parseXml(`<cutBuffer><items>
    ${article("100-00001", "100.0", "3.")}
    ${article("100-00002", "50.0")}
  </items></cutBuffer>`);

  const items = customItems(
    createPayload(doc, 1, true, false, undefined, x).lineItems,
  );

  expect(items.map((item) => [item.artNr, item.quantity])).toEqual([
    ["100-00001", 3],
    ["100-00002", 1],
  ]);
  expect(items[0].unitPrice.netAmount).toBe(100);
});

test("grouping adds up obx quantities", () => {
  const doc = parseXml(`<cutBuffer><items>
    ${article("100-00001", "100.0")}
    ${article("100-00001", "100.0", "3.")}
    ${article("100-00001", "100.0", "5.")}
  </items></cutBuffer>`);

  const items = customItems(
    createPayload(doc, 1, true, true, undefined, x).lineItems,
  );

  expect(items).toHaveLength(1);
  expect(items[0].quantity).toBe(9);
});

test("room totals include obx quantities", () => {
  const doc = parseXml(`<cutBuffer><items>
    ${article("100-00001", "250.0", "3.")}
  </items></cutBuffer>`);

  const { lineItems } = createPayload(
    { "Raum 1": doc },
    1,
    true,
    true,
    undefined,
    x,
  );

  expect((lineItems as TextLineItem[]).map((item) => item.name)).toContain(
    "Nettosumme Raum 1: 750,00 EUR",
  );
});
