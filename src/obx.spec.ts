import { expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { DOMParser } from "@xmldom/xmldom";
import * as XLSX from "xlsx";
import xpath from "xpath";

import { createPayload } from "./obx.ts";
import type { CustomLineItem, LineItemWithType, Quotation } from "./types.ts";
import { count } from "./util.ts";

const utf8 = { encoding: "utf-8" } as const;
const address = { name: "Testkunde", countryCode: "DE" };

const x = xpath as unknown as XPathEvaluator;

// Load non-discounted article numbers from xlsx file
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
      const artNr = row[0]; // Column A (index 0)
      const columnC = row[2]; // Column C (index 2)

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

  // Create a set with some non-discounted article numbers
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

  // Find the items with these article numbers
  const item1 = payload.lineItems.find(
    (item) => "artNr" in item && item.artNr === "502-00039",
  ) as CustomLineItem;
  const item2 = payload.lineItems.find(
    (item) => "artNr" in item && item.artNr === "377-00008",
  ) as CustomLineItem;
  const item3 = payload.lineItems.find(
    (item) => "artNr" in item && item.artNr === "550-00013",
  ) as CustomLineItem;

  // Check that non-discounted items are marked correctly
  expect(item1).toBeDefined();
  expect(item1.isNonDiscounted).toBe(true);
  expect(item1.hasNonDiscountedSubItems).toBe(false);
  expect(item2).toBeDefined();
  expect(item2.isNonDiscounted).toBe(true);
  expect(item2.hasNonDiscountedSubItems).toBe(false);

  // Check that discounted items are not marked
  expect(item3).toBeDefined();
  expect(item3.isNonDiscounted).toBe(false);
  expect(item3.hasNonDiscountedSubItems).toBe(false);
});
