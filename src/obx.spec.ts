import { readFile } from "node:fs/promises";
import { test, expect } from "bun:test";
import { DOMParser } from "@xmldom/xmldom";
import xpath from "xpath";

import { createPayload } from "./obx.ts";

test("generate valid json for simple obx 1", async () => {
  const parser = new DOMParser();
  const obx = await readFile("examples/01.obx", { encoding: "utf-8" });
  const short = await readFile("examples/01-short.json", { encoding: "utf-8" });
  const long = await readFile("examples/01-long.json", { encoding: "utf-8" });

  const parsed = parser.parseFromString(obx, "application/xml");

  expect(
    JSON.parse(createPayload(parsed as any, 1, false, xpath as any)).lineItems
  ).toEqual(JSON.parse(short).lineItems);
  // expect(
  //   JSON.parse(createPayload(parsed as any, 1, true, xpath as any)).lineItems
  // ).toEqual(JSON.parse(long).lineItems);
});

test("generate valid json for another obx 2", async () => {
  const parser = new DOMParser();
  const obx = await readFile("examples/02.obx", { encoding: "utf-8" });
  const short = await readFile("examples/02-short.json", { encoding: "utf-8" });
  const long = await readFile("examples/02-long.json", { encoding: "utf-8" });

  const parsed = parser.parseFromString(obx, "application/xml");

  expect(
    JSON.parse(createPayload(parsed as any, 1, false, xpath as any)).lineItems
  ).toEqual(JSON.parse(short).lineItems);
  // expect(
  //   JSON.parse(createPayload(parsed as any, 1, true, xpath as any)).lineItems
  // ).toEqual(JSON.parse(long).lineItems);
});

test("generate valid json for complex obx 3", async () => {
  const parser = new DOMParser();
  const obx = await readFile("examples/03.obx", { encoding: "utf-8" });
  const short = await readFile("examples/03-short.json", { encoding: "utf-8" });
  const long = await readFile("examples/03-long.json", { encoding: "utf-8" });
  const parsed = parser.parseFromString(obx, "application/xml");

  expect(
    JSON.parse(createPayload(parsed as any, 1, false, xpath as any)).lineItems
  ).toEqual(JSON.parse(short).lineItems);
  // expect(
  //   JSON.parse(createPayload(parsed as any, 1, true, xpath as any)).lineItems
  // ).toEqual(JSON.parse(long).lineItems);
});

test("generate valid json for another complex obx 4", async () => {
  const parser = new DOMParser();
  const obx = await readFile("examples/04.obx", { encoding: "utf-8" });
  const short = await readFile("examples/04-short.json", { encoding: "utf-8" });
  const long = await readFile("examples/04-long.json", { encoding: "utf-8" });
  const parsed = parser.parseFromString(obx, "application/xml");

  expect(
    JSON.parse(createPayload(parsed as any, 1, false, xpath as any)).lineItems
  ).toEqual(JSON.parse(short).lineItems);
  // expect(
  //   JSON.parse(createPayload(parsed as any, 1, true, xpath as any)).lineItems
  // ).toEqual(JSON.parse(long).lineItems);
});

test("generate valid json for another complex obx 5", async () => {
  const parser = new DOMParser();
  const obx = await readFile("examples/05.obx", { encoding: "utf-8" });
  const short = await readFile("examples/05-short.json", { encoding: "utf-8" });
  const long = await readFile("examples/05-long.json", { encoding: "utf-8" });
  const parsed = parser.parseFromString(obx, "application/xml");

  expect(
    JSON.parse(
      createPayload(parsed as any, 1, false, xpath as any)
    ).lineItems.slice(0, 2)
  ).toEqual(JSON.parse(short).lineItems);
  // expect(
  //   JSON.parse(
  //     createPayload(parsed as any, 1, true, xpath as any)
  //   ).lineItems.slice(0, 2)
  // ).toEqual(JSON.parse(long).lineItems);
});
