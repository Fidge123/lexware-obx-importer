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

function planningHelperDocument(): Document {
  return parseXml(`<cutBuffer><items>
    ${article(
      "TEILPLANNUNG_TP",
      "Planungshilfe Tischplatten",
      "0.00",
      article("581-00106", "Tischplatte Eiche", "250.00") +
        article("581-00107", "Tischplatte Nussbaum", "300.00"),
    )}
  </items></cutBuffer>`);
}

test("planning helper articles are renamed for the customer", () => {
  const { lineItems } = createPayload(
    planningHelperDocument(),
    1,
    true,
    false,
    undefined,
    x,
  );
  const item = lineItems[0] as CustomLineItem;

  expect(item.name).toBe("Tischplatte individuell");
  expect(item.artNr).toBe("TEILPLANNUNG_TP");
  expect(item.unitPrice.netAmount).toBe(550);
});

test("planning helper articles are left out of the summary of their children", () => {
  const { lineItems } = createPayload(
    planningHelperDocument(),
    1,
    true,
    false,
    undefined,
    x,
  );
  const summary = lineItems[1] as TextLineItem;

  expect(summary.name).toBe("Bestehend aus:");
  expect(summary.description).not.toContain("Tischplatte individuell");
  expect(summary.description).not.toContain("TEILPLANNUNG_TP");
  expect(summary.description).not.toContain("Planungshilfe Tischplatten");
  expect(summary.description).toContain(
    "1x Tischplatte Eiche | 581-00106 | je 250.00 EUR",
  );
  expect(summary.description).toContain(
    "1x Tischplatte Nussbaum | 581-00107 | je 300.00 EUR",
  );
});

test("regular articles keep their own line in the summary", () => {
  const doc = parseXml(`<cutBuffer><items>
    ${article(
      "581-00106",
      "Schreibtisch",
      "500.00",
      article("581-00200", "Kabelwanne", "50.00"),
    )}
  </items></cutBuffer>`);

  const { lineItems } = createPayload(doc, 1, true, false, undefined, x);
  const item = lineItems[0] as CustomLineItem;
  const summary = lineItems[1] as TextLineItem;

  expect(item.name).toBe("581-00106 | Schreibtisch");
  expect(summary.description).toContain(
    "1x 581-00106 | Schreibtisch | je 500.00 EUR",
  );
  expect(summary.description).toContain("1x Kabelwanne | 581-00200 | je 50.00");
});

test("articles without children have no summary", () => {
  const doc = parseXml(`<cutBuffer><items>
    ${article("581-00106", "Schreibtisch", "500.00")}
    ${article("TEILPLANNUNG_TP", "Planungshilfe Tischplatten", "0.00")}
  </items></cutBuffer>`);

  const { lineItems } = createPayload(doc, 1, true, false, undefined, x);

  expect(
    lineItems.filter((item) => "type" in item && item.type === "text"),
  ).toBeEmpty();
});
