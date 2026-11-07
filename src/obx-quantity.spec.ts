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
    <description type="short"><text lang="de">Sockelschrank</text></description>
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
    ${article("311-00054", "1238.0", "4.")}
    ${article("311-00056", "764.0")}
  </items></cutBuffer>`);

  const items = customItems(
    createPayload(doc, 1, true, false, undefined, x).lineItems,
  );

  expect(items.map((item) => [item.artNr, item.quantity])).toEqual([
    ["311-00054", 4],
    ["311-00056", 1],
  ]);
  expect(items[0].unitPrice.netAmount).toBe(1238);
});

test("grouping adds up obx quantities", () => {
  const doc = parseXml(`<cutBuffer><items>
    ${article("550-00014", "699.3")}
    ${article("550-00014", "699.3")}
    ${article("550-00014", "699.3", "4.")}
  </items></cutBuffer>`);

  const items = customItems(
    createPayload(doc, 1, true, true, undefined, x).lineItems,
  );

  expect(items).toHaveLength(1);
  expect(items[0].quantity).toBe(6);
});

test("room totals include obx quantities", () => {
  const doc = parseXml(`<cutBuffer><items>
    ${article("502-00003", "508.0", "2.")}
  </items></cutBuffer>`);

  const { lineItems } = createPayload(
    { "Pos. 2": doc },
    1,
    true,
    true,
    undefined,
    x,
  );

  expect((lineItems as TextLineItem[]).map((item) => item.name)).toContain(
    "Nettosumme Pos. 2: 1.016,00 EUR",
  );
});
