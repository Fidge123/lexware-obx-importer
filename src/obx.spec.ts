import { readFile } from "node:fs/promises";
import { test, expect } from "bun:test";
import { DOMParser } from "@xmldom/xmldom";
import xpath from "xpath";

import { createPayload } from "./obx.ts";
import { count } from "./util.ts";
import type { CustomLineItem, LineItemWithType, Quotation } from "./types.ts";

const utf8 = { encoding: "utf-8" } as const;

const x = xpath as unknown as XPathEvaluator;
test("generate valid json for simple obx 1", async () => {
  const parser = new DOMParser();
  const obx = await readFile("examples/01.obx", utf8);
  const short = await readFile("examples/01-short.json", utf8);
  const long = await readFile("examples/01-long.json", utf8);

  const parsed = parser.parseFromString(
    obx,
    "application/xml",
  ) as unknown as Document;

  expect(createPayload(parsed, 1, false, true, x).lineItems).toEqual(
    JSON.parse(short).lineItems,
  );
  expect(createPayload(parsed, 1, true, true, x).lineItems).toEqual(
    JSON.parse(long).lineItems,
  );
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

  expect(createPayload(parsed, 1, false, true, x).lineItems).toEqual(
    JSON.parse(short).lineItems,
  );
  expect(createPayload(parsed, 1, true, true, x).lineItems).toEqual(
    JSON.parse(long).lineItems,
  );
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

  expect(createPayload(parsed, 1, false, true, x).lineItems).toEqual(
    JSON.parse(short).lineItems,
  );
  expect(createPayload(parsed, 1, true, true, x).lineItems).toEqual(
    JSON.parse(long).lineItems,
  );
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

  expect(createPayload(parsed, 1, false, true, x).lineItems).toEqual(
    JSON.parse(short).lineItems,
  );
  expect(createPayload(parsed, 1, true, true, x).lineItems).toEqual(
    JSON.parse(long).lineItems,
  );
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

  expect(createPayload(parsed, 1, false, true, x).lineItems).toEqual(
    JSON.parse(short).lineItems,
  );
  expect(createPayload(parsed, 1, true, true, x).lineItems).toEqual(
    JSON.parse(long).lineItems,
  );
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

  expect(createPayload(parsed, 1, false, true, x).lineItems).toEqual(
    JSON.parse(short).lineItems,
  );
  expect(createPayload(parsed, 1, true, true, x).lineItems).toEqual(
    JSON.parse(long).lineItems,
  );
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

  expect(createPayload(parsed, 1, false, true, x).lineItems).toEqual(
    JSON.parse(short).lineItems,
  );
  expect(createPayload(parsed, 1, true, true, x).lineItems).toEqual(
    JSON.parse(long).lineItems,
  );
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

  expect(createPayload(parsed, 1, false, false, x).lineItems).toEqual(
    JSON.parse(short).lineItems,
  );
  expect(createPayload(parsed, 1, true, false, x).lineItems).toEqual(
    JSON.parse(long).lineItems,
  );

  for (const item of createPayload(parsed, 1, false, false, x)
    .lineItems as CustomLineItem[]) {
    expect(item.quantity).toBe(1);
  }

  expect(
    count(
      createPayload(parsed, 1, true, false, x).lineItems as LineItemWithType[],
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
  expect(createPayload(parsed, 1.05, false, true, x).lineItems).toEqual(
    JSON.parse(short5).lineItems,
  );
  expect(createPayload(parsed, 1.05, true, true, x).lineItems).toEqual(
    JSON.parse(long5).lineItems,
  );

  for (const [i, item] of (
    createPayload(parsed, 1.05, false, true, x).lineItems as CustomLineItem[]
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
