#!/usr/bin/env bun

import { readFile, writeFile } from "node:fs/promises";
import { DOMParser } from "@xmldom/xmldom";
import xpath from "xpath";
import { createPayload, type PriceSource } from "../src/obx.ts";
import { parsePriceList } from "../src/priceList.ts";
import type { LineItem } from "../src/types.ts";

const x = xpath as unknown as XPathEvaluator;
const address = { name: "Testkunde", countryCode: "DE" };

async function parse(name: string): Promise<Document> {
  return new DOMParser().parseFromString(
    await readFile(`examples/${name}.obx`, "utf-8"),
    "application/xml",
  ) as unknown as Document;
}

async function loadPriceList(filename: string) {
  return parsePriceList(await readFile(`examples/${filename}`));
}

// Only lineItems are compared, so the rest of each file is kept to avoid noise like new voucher dates.
async function write(name: string, lineItems: LineItem[]) {
  const path = `examples/${name}.json`;
  const current = JSON.parse(await readFile(path, "utf-8"));
  const next = Array.isArray(current) ? lineItems : { ...current, lineItems };
  await writeFile(path, `${JSON.stringify(next, null, 2)}\n`);
  console.log(`✅ ${path}`);
}

const nonDiscounted = new Set(
  (await loadPriceList("Preisliste EXPLORIS 2024_DE_1.xlsx"))
    .nonDiscountedArtNrs,
);

function payload(
  parsed: Document | Record<string, Document>,
  multiplier: number,
  includeDescription: boolean,
  groupLineItems: boolean,
  nonDiscountedSet = nonDiscounted,
  priceList?: Map<string, number>,
  priceSource?: PriceSource,
): LineItem[] {
  return createPayload(
    parsed,
    multiplier,
    includeDescription,
    groupLineItems,
    address,
    x,
    nonDiscountedSet,
    priceList,
    priceSource,
  ).lineItems;
}

for (const name of ["01", "02", "03", "04", "05", "06", "07"]) {
  const parsed = await parse(name);
  await write(`${name}-short`, payload(parsed, 1, false, true));
  await write(`${name}-long`, payload(parsed, 1, true, true));
}

const obx7 = await parse("07");
await write("07-short-ungrouped", payload(obx7, 1, false, false));
await write("07-long-ungrouped", payload(obx7, 1, true, false));
await write("07-short-plus-five", payload(obx7, 1.05, false, true));
await write("07-long-plus-five", payload(obx7, 1.05, true, true));

const obx8 = await parse("08");
await write("08-ungrouped", payload(obx8, 1, true, false));
await write("08-grouped", payload(obx8, 1, true, true));

await write(
  "01-02-long",
  payload(
    { "Raum 1": await parse("01"), "Raum 2": await parse("02") },
    1,
    true,
    true,
  ),
);

const obx9 = await parse("09");
const priceList2026 = await loadPriceList(
  "2026-07-10 FB Preisliste_EXPLORIS_2026_SEUR_DE.xlsx",
);
for (const [name, source] of [
  ["09-obx-prices", "obx"],
  ["09-price-list", "priceList"],
] as const) {
  await write(
    name,
    payload(
      obx9,
      1,
      true,
      true,
      new Set(priceList2026.nonDiscountedArtNrs),
      new Map(Object.entries(priceList2026.prices)),
      source,
    ),
  );
}

const obx10 = await parse("10");
await write("10-grouped", payload(obx10, 1, true, true, new Set()));
await write("10-ungrouped", payload(obx10, 1, true, false, new Set()));
