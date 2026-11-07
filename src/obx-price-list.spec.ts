import { expect, test } from "bun:test";
import { DOMParser } from "@xmldom/xmldom";
import xpath from "xpath";

import { createPayload, findPriceMismatches } from "./obx.ts";
import type { CustomLineItem, TextLineItem } from "./types.ts";

const x = xpath as unknown as XPathEvaluator;

function parseXml(xml: string): Document {
  return new DOMParser().parseFromString(
    xml,
    "application/xml",
  ) as unknown as Document;
}

function article(
  artNr: string,
  shortDescription: string,
  price: string,
  children = "",
): string {
  return `<bskArticle>
    <artNr type="final">${artNr}</artNr>
    <description type="short"><text lang="de">${shortDescription}</text></description>
    <description type="features"><text lang="de">Merkmale ${artNr}</text></description>
    <itemPrice type="sale" pd="1" value="${price}" currency="EUR"/>
    ${children}
  </bskArticle>`;
}

function document(): Document {
  return parseXml(`<cutBuffer><items>
    ${article(
      "100-00001",
      "Artikel A",
      "1000.0",
      article("100-00002", "Artikel B", "500.0") +
        article("100-00003", "Artikel C", "NaN"),
    )}
    ${article("100-00004", "Artikel D", "300.0")}
  </items></cutBuffer>`);
}

const priceList = new Map([
  ["100-00002", 500],
  ["100-00003", 250],
  ["100-00004", 320],
]);

test("finds articles whose prices differ from the price list", () => {
  expect(findPriceMismatches(document(), priceList, x)).toEqual([
    {
      artNr: "100-00003",
      name: "Artikel C",
      obxPrice: null,
      listPrice: 250,
    },
    {
      artNr: "100-00004",
      name: "Artikel D",
      obxPrice: 300,
      listPrice: 320,
    },
  ]);
});

test("reports every article only once across multiple documents", () => {
  const mismatches = findPriceMismatches(
    { "a.obx": document(), "b.obx": document() },
    priceList,
    x,
  );
  expect(mismatches.map((m) => m.artNr)).toEqual(["100-00003", "100-00004"]);
});

test("no mismatches without a price list", () => {
  expect(findPriceMismatches(document(), new Map(), x)).toEqual([]);
});

test("obx prices are used by default and missing prices count as 0", () => {
  const { lineItems } = createPayload(
    document(),
    1,
    true,
    false,
    undefined,
    x,
    new Set(),
    priceList,
  );
  expect((lineItems[0] as CustomLineItem).unitPrice.netAmount).toBe(1500);
  expect((lineItems[2] as CustomLineItem).unitPrice.netAmount).toBe(300);
});

test("price list prices replace obx prices when chosen", () => {
  const { lineItems } = createPayload(
    document(),
    1.1,
    true,
    false,
    undefined,
    x,
    new Set(),
    priceList,
    "priceList",
  );
  const parent = lineItems[0] as CustomLineItem;
  // 100-00001 is not in the price list
  expect(parent.unitPrice.netAmount).toBe(
    Math.round((1000 + 500 + 250) * 1.1 * 100) / 100,
  );
  expect((lineItems[1] as TextLineItem).description).toContain(
    "1x Artikel C | 100-00003 | je 275.00 EUR",
  );
  expect((lineItems[2] as CustomLineItem).unitPrice.netAmount).toBe(352);
});
