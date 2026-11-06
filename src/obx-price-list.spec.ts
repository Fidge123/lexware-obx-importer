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
      "550-00015",
      "Tischplatte",
      "1409.4",
      article("581-00081", "Spülbecken", "1408.0") +
        article("579-00046", "Abtropfrillen", "NaN"),
    )}
    ${article("567-00444", "Beckenausschnitt", "300.0")}
  </items></cutBuffer>`);
}

const priceList = new Map([
  ["581-00081", 1408],
  ["579-00046", 275],
  ["567-00444", 326],
]);

test("finds articles whose prices differ from the price list", () => {
  expect(findPriceMismatches(document(), priceList, x)).toEqual([
    {
      artNr: "579-00046",
      name: "Abtropfrillen",
      obxPrice: null,
      listPrice: 275,
    },
    {
      artNr: "567-00444",
      name: "Beckenausschnitt",
      obxPrice: 300,
      listPrice: 326,
    },
  ]);
});

test("reports every article only once across multiple documents", () => {
  const mismatches = findPriceMismatches(
    { "a.obx": document(), "b.obx": document() },
    priceList,
    x,
  );
  expect(mismatches.map((m) => m.artNr)).toEqual(["579-00046", "567-00444"]);
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
  expect((lineItems[0] as CustomLineItem).unitPrice.netAmount).toBe(2817.4);
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
  const table = lineItems[0] as CustomLineItem;
  // 550-00015 is not in the price list
  expect(table.unitPrice.netAmount).toBe(
    Math.round((1409.4 + 1408 + 275) * 1.1 * 100) / 100,
  );
  expect((lineItems[1] as TextLineItem).description).toContain(
    "1x Abtropfrillen | 579-00046 | je 302.50 EUR",
  );
  expect((lineItems[2] as CustomLineItem).unitPrice.netAmount).toBe(358.6);
});
