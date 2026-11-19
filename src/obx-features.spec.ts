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

function article(artNr: string, features: string, subArticles = ""): string {
  return `<bskArticle>
    <artNr type="final">${artNr}</artNr>
    <description type="short"><text lang="de">Artikel</text></description>
    <description type="long"><text lang="de">Lang ${artNr}</text></description>
    <description type="features"><text lang="de">Merkmale ${artNr}</text></description>
    <features>${features}</features>
    <itemPrice type="sale" pd="1" value="100.0" currency="EUR"/>
    ${subArticles}
  </bskArticle>`;
}

function payload(xml: string, grouped = false) {
  return createPayload(
    parseXml(`<cutBuffer><items>${xml}</items></cutBuffer>`),
    1,
    true,
    grouped,
    undefined,
    x,
  ).lineItems;
}

const breite = `<feature name="BREITE" value="B900" flags="1" id="feature.0">
  <nameText lang="de">Breite</nameText><nameText lang="en">Width</nameText>
  <valueText lang="de">900mm</valueText>
</feature>`;

test("descriptions list all-caps features instead of the features description", () => {
  const [item] = payload(
    article(
      "311-00007",
      `${breite}
      <feature name="NUMMER" value="311-00007" flags="0">
        <nameText lang="de">Artikelnummer</nameText><valueText lang="de">311-00007</valueText>
      </feature>
      <feature name="Gewicht" value="40.3" flags="1">
        <nameText lang="de">Gewicht</nameText><valueText lang="de">40.3</valueText>
      </feature>
      <feature name="LANGTEXT" value="311-00007" flags="1">
        <nameText lang="de">Langtext</nameText>
        <valueText lang="de">Eckunterschrank,
          1 Tür rechts</valueText>
      </feature>
      <feature name="P1_BREITE" value="830" flags="1">
        <nameText lang="de">P1_BREITE</nameText><valueText lang="de">830</valueText>
      </feature>
      <feature name="MEDIUM" value="AR" flags="1" nameText="feature.999"/>
      <feature name="ABLAGE" value="1" flags="0">
        <nameText lang="de">Ablageboden</nameText><valueText lang="de">1 Ablageboden</valueText>
      </feature>`,
    ),
  ) as CustomLineItem[];

  expect(item.description).toBe("Breite: 900mm\nEckunterschrank, 1 Tür rechts");
});

test("feature texts are resolved by id reference and by earlier occurrence", () => {
  const items = payload(
    article("311-00007", breite) +
      article(
        "311-00141",
        `<feature name="BREITE" value="B600" flags="1" nameText="feature.0">
          <valueText lang="de">600mm</valueText>
        </feature>`,
      ) +
      article(
        "311-00163",
        `<feature name="BREITE" value="B900" flags="1"><nameText/><valueText/></feature>`,
      ),
  ) as CustomLineItem[];

  expect(items.slice(0, 3).map((item) => item.description)).toEqual([
    "Breite: 900mm",
    "Breite: 600mm",
    "Breite: 900mm",
  ]);
});

test("long texts are kept without a German feature name", () => {
  const [item] = payload(
    article(
      "735-00139",
      `<feature name="ARTIKELTEXT" value="735-00139" flags="1" nameText="feature.999">
        <valueText lang="de">Gasart: Argon (Ar)</valueText>
      </feature>`,
    ),
  ) as CustomLineItem[];

  expect(item.description).toBe("Gasart: Argon (Ar)");
});

test("articles without all-caps features fall back to the long description", () => {
  const [item] = payload(article("471-00003", "")) as CustomLineItem[];

  expect(item.description).toBe("Lang 471-00003");
});

test("sub articles with different features are not aggregated", () => {
  const variant = (value: string) =>
    article(
      "357-00015",
      `<feature name="TISCHTIEFE" value="${value}" flags="1">
        <nameText lang="de">Tischtiefe</nameText><valueText lang="de">${value}</valueText>
      </feature>`,
    );
  const [, composition] = payload(
    article("311-00126", "", variant("600mm") + variant("750mm")),
  ) as [CustomLineItem, TextLineItem];

  expect(composition.description).toContain(
    "1x Artikel | 357-00015 | je 100.00 EUR\nTischtiefe: 600mm",
  );
  expect(composition.description).toContain(
    "1x Artikel | 357-00015 | je 100.00 EUR\nTischtiefe: 750mm",
  );
});
