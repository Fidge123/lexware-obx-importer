import { expect, test } from "bun:test";
import { DOMParser } from "@xmldom/xmldom";
import xpath from "xpath";

import {
  compareVersions,
  findUnsafeObxVersions,
  getBskXmlVersion,
  highestVersion,
} from "./obxVersion.ts";

const x = xpath as unknown as XPathEvaluator;

function parseXml(xml: string): Document {
  return new DOMParser().parseFromString(
    xml,
    "application/xml",
  ) as unknown as Document;
}

test("compareVersions compares numerically per segment", () => {
  expect(compareVersions("1.8.11", "1.8.11")).toBe(0);
  expect(compareVersions("1.8.12", "1.8.11")).toBe(1);
  expect(compareVersions("1.8.9", "1.8.11")).toBe(-1);
  expect(compareVersions("1.10", "1.9.99")).toBe(1);
  expect(compareVersions("1.8", "1.8.0")).toBe(0);
});

test("reads bskXmlVersion from an attribute or an element", () => {
  expect(
    getBskXmlVersion(parseXml(`<cutBuffer bskXmlVersion="1.8.11"/>`), x),
  ).toBe("1.8.11");
  expect(
    getBskXmlVersion(
      parseXml(`<cutBuffer><bskXmlVersion> 1.9.0 </bskXmlVersion></cutBuffer>`),
      x,
    ),
  ).toBe("1.9.0");
  expect(getBskXmlVersion(parseXml(`<cutBuffer/>`), x)).toBeUndefined();
});

test("only versions newer than the safe version are reported", () => {
  const docs = {
    "old.obx": parseXml(`<cutBuffer bskXmlVersion="1.8.10"/>`),
    "safe.obx": parseXml(`<cutBuffer bskXmlVersion="1.8.11"/>`),
    "new.obx": parseXml(`<cutBuffer bskXmlVersion="1.8.12"/>`),
    "none.obx": parseXml(`<cutBuffer/>`),
  };

  expect(findUnsafeObxVersions(docs, "1.8.11", x)).toEqual([
    { filename: "new.obx", version: "1.8.12" },
  ]);
  expect(findUnsafeObxVersions(docs, "1.8.12", x)).toEqual([]);
});

test("highestVersion picks the newest version", () => {
  expect(highestVersion(["1.8.12", "1.10.0", "1.9.3"])).toBe("1.10.0");
});
