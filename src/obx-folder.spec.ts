import { expect, test } from "bun:test";
import { DOMParser } from "@xmldom/xmldom";
import xpath from "xpath";

import { createPayload } from "./obx.ts";
import type { CustomLineItem } from "./types.ts";

const x = xpath as unknown as XPathEvaluator;

function parseXml(xml: string): Document {
  return new DOMParser().parseFromString(
    xml,
    "application/xml",
  ) as unknown as Document;
}

function article(artNr: string, price: string, volume = "0.5"): string {
  return `<bskArticle>
    <artNr type="final">${artNr}</artNr>
    <description type="short"><text lang="de">Artikel</text></description>
    <description type="features"><text lang="de">Merkmale ${artNr}</text></description>
    <itemPrice type="sale" pd="1" value="${price}" currency="EUR"/>
    <packInfo key="volume" value="${volume}"/>
  </bskArticle>`;
}

function customItems(lineItems: unknown[]): CustomLineItem[] {
  return lineItems.filter(
    (item): item is CustomLineItem =>
      (item as CustomLineItem).type === "custom" &&
      (item as CustomLineItem).name !== "Frachtkosten und Verbringung",
  );
}

const doc = parseXml(`<cutBuffer><items>
  <bskFolder>
    <label>Groups</label>
    ${article("100-00001", "100.0")}
    ${article("100-00002", "50.0")}
  </bskFolder>
  ${article("100-00003", "30.0")}
  ${article("100-00004", "20.0", "2.0")}
</items></cutBuffer>`);

test("imports articles placed directly in a folder and next to it", () => {
  const items = customItems(
    createPayload(doc, 1, true, false, undefined, x).lineItems,
  );

  expect(items.map((item) => [item.artNr, item.unitPrice.netAmount])).toEqual([
    ["100-00001", 100],
    ["100-00002", 50],
    ["100-00003", 30],
    ["100-00004", 20],
  ]);
  expect(items[0].description).toBe("Merkmale 100-00001");
});

test("ships the volume of folder and loose articles", () => {
  const { lineItems } = createPayload(doc, 1, true, false, undefined, x);
  const shipping = lineItems[lineItems.length - 1] as CustomLineItem;

  expect(shipping.description).toStartWith("Volumen: 3.50m³");
  expect(shipping.unitPrice.netAmount).toBe(560);
});
