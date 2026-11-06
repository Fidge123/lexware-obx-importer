import { expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { DOMParser } from "@xmldom/xmldom";
import * as XLSX from "xlsx";
import xpath from "xpath";

import { createPayload, findPriceMismatches } from "./obx.ts";
import { parsePriceList } from "./priceList.ts";
import type { CustomLineItem, LineItemWithType, Quotation } from "./types.ts";
import { count } from "./util.ts";

const utf8 = { encoding: "utf-8" } as const;
const address = { name: "Testkunde", countryCode: "DE" };

const x = xpath as unknown as XPathEvaluator;

async function loadNonDiscountedArtNrs(): Promise<Set<string>> {
  try {
    const buffer = await readFile(
      "examples/Preisliste EXPLORIS 2024_DE_1.xlsx",
    );
    const workbook = XLSX.read(buffer);
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(firstSheet, {
      header: 1,
    }) as unknown[][];

    const nonDiscountedArtNrs: string[] = [];
    for (const row of data) {
      const artNr = row[0];
      const columnC = row[2];

      if (
        artNr &&
        typeof artNr === "string" &&
        columnC &&
        typeof columnC === "string" &&
        columnC.toLowerCase().includes("netto")
      ) {
        nonDiscountedArtNrs.push(artNr.trim());
      }
    }

    return new Set(nonDiscountedArtNrs);
  } catch (error) {
    console.error("Error loading non-discounted list:", error);
    return new Set();
  }
}

const nonDiscountedSet = await loadNonDiscountedArtNrs();

test("generate valid json for simple obx 1", async () => {
  const parser = new DOMParser();
  const obx = await readFile("examples/01.obx", utf8);
  const short = await readFile("examples/01-short.json", utf8);
  const long = await readFile("examples/01-long.json", utf8);

  const parsed = parser.parseFromString(
    obx,
    "application/xml",
  ) as unknown as Document;

  expect(
    createPayload(parsed, 1, false, true, address, x, nonDiscountedSet)
      .lineItems,
  ).toEqual(JSON.parse(short).lineItems);
  expect(
    createPayload(parsed, 1, true, true, address, x, nonDiscountedSet)
      .lineItems,
  ).toEqual(JSON.parse(long).lineItems);
});

test("generate valid json for another obx 2", async () => {
  const parser = new DOMParser();
  const obx = await readFile("examples/02.obx", utf8);
  const short = await readFile("examples/02-short.json", utf8);
  const long = await readFile("examples/02-long.json", utf8);

  const parsed = parser.parseFromString(
    obx,
    "application/xml",
  ) as unknown as Document;

  expect(
    createPayload(parsed, 1, false, true, address, x, nonDiscountedSet)
      .lineItems,
  ).toEqual(JSON.parse(short).lineItems);
  expect(
    createPayload(parsed, 1, true, true, address, x, nonDiscountedSet)
      .lineItems,
  ).toEqual(JSON.parse(long).lineItems);
});

test("generate valid json for complex obx 3", async () => {
  const parser = new DOMParser();
  const obx = await readFile("examples/03.obx", utf8);
  const short = await readFile("examples/03-short.json", utf8);
  const long = await readFile("examples/03-long.json", utf8);
  const parsed = parser.parseFromString(
    obx,
    "application/xml",
  ) as unknown as Document;

  expect(
    createPayload(parsed, 1, false, true, address, x, nonDiscountedSet)
      .lineItems,
  ).toEqual(JSON.parse(short).lineItems);
  expect(
    createPayload(parsed, 1, true, true, address, x, nonDiscountedSet)
      .lineItems,
  ).toEqual(JSON.parse(long).lineItems);
});

test("generate valid json for another complex obx 4", async () => {
  const parser = new DOMParser();
  const obx = await readFile("examples/04.obx", utf8);
  const short = await readFile("examples/04-short.json", utf8);
  const long = await readFile("examples/04-long.json", utf8);
  const parsed = parser.parseFromString(
    obx,
    "application/xml",
  ) as unknown as Document;

  expect(
    createPayload(parsed, 1, false, true, address, x, nonDiscountedSet)
      .lineItems,
  ).toEqual(JSON.parse(short).lineItems);
  expect(
    createPayload(parsed, 1, true, true, address, x, nonDiscountedSet)
      .lineItems,
  ).toEqual(JSON.parse(long).lineItems);
});

test("generate valid json for another complex obx 5", async () => {
  const parser = new DOMParser();
  const obx = await readFile("examples/05.obx", utf8);
  const short = await readFile("examples/05-short.json", utf8);
  const long = await readFile("examples/05-long.json", utf8);
  const parsed = parser.parseFromString(
    obx,
    "application/xml",
  ) as unknown as Document;

  expect(
    createPayload(parsed, 1, false, true, address, x, nonDiscountedSet)
      .lineItems,
  ).toEqual(JSON.parse(short).lineItems);
  expect(
    createPayload(parsed, 1, true, true, address, x, nonDiscountedSet)
      .lineItems,
  ).toEqual(JSON.parse(long).lineItems);
});

test("generate valid json for another complex obx 6", async () => {
  const parser = new DOMParser();
  const obx = await readFile("examples/06.obx", utf8);
  const short = await readFile("examples/06-short.json", utf8);
  const long = await readFile("examples/06-long.json", utf8);
  const parsed = parser.parseFromString(
    obx,
    "application/xml",
  ) as unknown as Document;

  expect(
    createPayload(parsed, 1, false, true, address, x, nonDiscountedSet)
      .lineItems,
  ).toEqual(JSON.parse(short).lineItems);
  expect(
    createPayload(parsed, 1, true, true, address, x, nonDiscountedSet)
      .lineItems,
  ).toEqual(JSON.parse(long).lineItems);
});

test("generate valid json for another complex obx 7", async () => {
  const parser = new DOMParser();
  const obx = await readFile("examples/07.obx", utf8);
  const short = await readFile("examples/07-short.json", utf8);
  const long = await readFile("examples/07-long.json", utf8);
  const parsed = parser.parseFromString(
    obx,
    "application/xml",
  ) as unknown as Document;

  expect(
    createPayload(parsed, 1, false, true, address, x, nonDiscountedSet)
      .lineItems,
  ).toEqual(JSON.parse(short).lineItems);
  expect(
    createPayload(parsed, 1, true, true, address, x, nonDiscountedSet)
      .lineItems,
  ).toEqual(JSON.parse(long).lineItems);
});

test("generate ungrouped json for obx 7", async () => {
  const parser = new DOMParser();
  const obx = await readFile("examples/07.obx", utf8);
  const short = await readFile("examples/07-short-ungrouped.json", utf8);
  const long = await readFile("examples/07-long-ungrouped.json", utf8);
  const longGrouped = await readFile("examples/07-long.json", utf8);
  const parsed = parser.parseFromString(
    obx,
    "application/xml",
  ) as unknown as Document;

  expect(
    createPayload(parsed, 1, false, false, address, x, nonDiscountedSet)
      .lineItems,
  ).toEqual(JSON.parse(short).lineItems);
  expect(
    createPayload(parsed, 1, true, false, address, x, nonDiscountedSet)
      .lineItems,
  ).toEqual(JSON.parse(long).lineItems);

  for (const item of createPayload(
    parsed,
    1,
    false,
    false,
    address,
    x,
    nonDiscountedSet,
  ).lineItems as CustomLineItem[]) {
    expect(item.quantity).toBe(1);
  }

  expect(
    count(
      createPayload(parsed, 1, true, false, address, x, nonDiscountedSet)
        .lineItems as LineItemWithType[],
    ),
  ).toEqual(count(JSON.parse(longGrouped).lineItems));
});

test("generate valid json for another complex obx 7 with increased prices", async () => {
  const parser = new DOMParser();
  const obx = await readFile("examples/07.obx", utf8);
  const short = JSON.parse(
    await readFile("examples/07-short.json", utf8),
  ) as Quotation;
  const short5 = await readFile("examples/07-short-plus-five.json", utf8);
  const long5 = await readFile("examples/07-long-plus-five.json", utf8);
  const parsed = parser.parseFromString(
    obx,
    "application/xml",
  ) as unknown as Document;

  expect.assertions(71);
  expect(
    createPayload(parsed, 1.05, false, true, address, x, nonDiscountedSet)
      .lineItems,
  ).toEqual(JSON.parse(short5).lineItems);
  expect(
    createPayload(parsed, 1.05, true, true, address, x, nonDiscountedSet)
      .lineItems,
  ).toEqual(JSON.parse(long5).lineItems);

  for (const [i, item] of (
    createPayload(parsed, 1.05, false, true, address, x, nonDiscountedSet)
      .lineItems as CustomLineItem[]
  ).entries()) {
    if (item.name !== "Frachtkosten und Verbringung") {
      expect(
        Math.abs(
          item.unitPrice.netAmount -
            (short.lineItems[i] as CustomLineItem).unitPrice.netAmount * 1.05,
        ),
      ).toBeLessThan(0.008);
    }
  }
});

test("generate valid json for another complex obx 7", async () => {
  const parser = new DOMParser();
  const obx = await readFile("examples/08.obx", utf8);
  const ungrouped = await readFile("examples/08-ungrouped.json", utf8);
  const grouped = await readFile("examples/08-grouped.json", utf8);
  const parsed = parser.parseFromString(
    obx,
    "application/xml",
  ) as unknown as Document;

  expect(
    createPayload(parsed, 1, true, false, address, x, nonDiscountedSet)
      .lineItems,
  ).toEqual(JSON.parse(ungrouped).lineItems);
  expect(
    createPayload(parsed, 1, true, true, address, x, nonDiscountedSet)
      .lineItems,
  ).toEqual(JSON.parse(grouped).lineItems);
});

test("generate valid json for multi-OBX project", async () => {
  const parser = new DOMParser();
  const obx1 = await readFile("examples/01.obx", utf8);
  const obx2 = await readFile("examples/02.obx", utf8);
  const result = JSON.parse(
    await readFile("examples/01-02-long.json", utf8),
  ) as Quotation;
  const parsed1 = parser.parseFromString(
    obx1,
    "application/xml",
  ) as unknown as Document;
  const parsed2 = parser.parseFromString(
    obx2,
    "application/xml",
  ) as unknown as Document;

  expect(
    createPayload(
      { "Raum 1": parsed1, "Raum 2": parsed2 },
      1,
      true,
      true,
      address,
      x,
      nonDiscountedSet,
    ).lineItems,
  ).toEqual(result.lineItems);
});

test("mark items as non-discounted correctly", async () => {
  const parser = new DOMParser();
  const obx = await readFile("examples/01.obx", utf8);
  const parsed = parser.parseFromString(
    obx,
    "application/xml",
  ) as unknown as Document;

  const nonDiscounted = new Set(["502-00039", "377-00008"]);
  const payload = createPayload(
    parsed,
    1,
    false,
    true,
    address,
    x,
    nonDiscounted,
  );

  const item1 = payload.lineItems.find(
    (item) => "artNr" in item && item.artNr === "502-00039",
  ) as CustomLineItem;
  const item2 = payload.lineItems.find(
    (item) => "artNr" in item && item.artNr === "377-00008",
  ) as CustomLineItem;
  const item3 = payload.lineItems.find(
    (item) => "artNr" in item && item.artNr === "550-00013",
  ) as CustomLineItem;

  expect(item1).toBeDefined();
  expect(item1.isNonDiscounted).toBe(true);
  expect(item1.hasNonDiscountedSubItems).toBe(false);
  expect(item2).toBeDefined();
  expect(item2.isNonDiscounted).toBe(true);
  expect(item2.hasNonDiscountedSubItems).toBe(false);

  expect(item3).toBeDefined();
  expect(item3.isNonDiscounted).toBe(false);
  expect(item3.hasNonDiscountedSubItems).toBe(false);
});

test("use obx or price list prices for obx 9 with missing prices", async () => {
  const parser = new DOMParser();
  const obx = await readFile("examples/09.obx", utf8);
  const { nonDiscountedArtNrs, prices } = parsePriceList(
    await readFile(
      "examples/2026-07-10 FB Preisliste_EXPLORIS_2026_SEUR_DE.xlsx",
    ),
  );
  const obxPrices = JSON.parse(
    await readFile("examples/09-obx-prices.json", utf8),
  );
  const listPrices = JSON.parse(
    await readFile("examples/09-price-list.json", utf8),
  );
  const parsed = parser.parseFromString(
    obx,
    "application/xml",
  ) as unknown as Document;
  const nonDiscounted = new Set(nonDiscountedArtNrs);
  const priceList = new Map(Object.entries(prices));

  // 579-00046 has value='NaN' in 09.obx
  expect(
    findPriceMismatches(parsed, priceList, x).map((m) => m.artNr),
  ).toContain("579-00046");

  // Must match the app defaults the JSONs were created with
  expect(
    createPayload(
      parsed,
      1,
      true,
      true,
      address,
      x,
      nonDiscounted,
      priceList,
      "obx",
    ).lineItems,
  ).toEqual(obxPrices.lineItems ?? obxPrices);
  expect(
    createPayload(
      parsed,
      1,
      true,
      true,
      address,
      x,
      nonDiscounted,
      priceList,
      "priceList",
    ).lineItems,
  ).toEqual(listPrices.lineItems ?? listPrices);
});
