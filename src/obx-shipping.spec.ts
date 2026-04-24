import { expect, test } from "bun:test";
import { DOMParser } from "@xmldom/xmldom";
import xpath from "xpath";

import { computeShippingInputs } from "./obx.ts";

const x = xpath as unknown as XPathEvaluator;

function parseXml(xml: string): Document {
  return new DOMParser().parseFromString(
    xml,
    "application/xml",
  ) as unknown as Document;
}

test("computeShippingInputs extracts volumes and weights from packInfo", () => {
  const doc = parseXml(`<cutBuffer><items>
    <bskArticle>
      <packInfo key="volume" value="1.5"/>
      <packInfo key="netWeight" originalValue="50.0"/>
    </bskArticle>
    <bskArticle>
      <packInfo key="volume" value="0.8"/>
      <packInfo key="netWeight" originalValue="30.0"/>
    </bskArticle>
  </items></cutBuffer>`);

  const { volumes, weights } = computeShippingInputs(doc, x);

  expect(volumes).toEqual([1.5, 0.8]);
  expect(weights).toEqual([50, 30]);
});

test("computeShippingInputs falls back to VOLUMEN/GEWICHT feature attributes", () => {
  const doc = parseXml(`<cutBuffer><items>
    <bskArticle>
      <feature name="VOLUMEN" value="2.3"/>
      <feature name="GEWICHT" value="70.0"/>
    </bskArticle>
  </items></cutBuffer>`);

  const { volumes, weights } = computeShippingInputs(doc, x);

  expect(volumes).toHaveLength(1);
  expect(volumes[0]).toBeCloseTo(2.3);
  expect(weights[0]).toBeCloseTo(70.0);
});

test("computeShippingInputs falls back to Volumen/Gewicht feature attributes", () => {
  const doc = parseXml(`<cutBuffer><items>
    <bskArticle>
      <feature name="Volumen" value="1.2"/>
      <feature name="Gewicht" value="15.5"/>
    </bskArticle>
  </items></cutBuffer>`);

  const { volumes, weights } = computeShippingInputs(doc, x);

  expect(volumes[0]).toBeCloseTo(1.2);
  expect(weights[0]).toBeCloseTo(15.5);
});

test("computeShippingInputs combines volumes and weights across multiple documents", () => {
  const doc1 = parseXml(`<cutBuffer><items>
    <bskArticle>
      <packInfo key="volume" value="1.0"/>
      <packInfo key="netWeight" originalValue="10.0"/>
    </bskArticle>
  </items></cutBuffer>`);
  const doc2 = parseXml(`<cutBuffer><items>
    <bskArticle>
      <packInfo key="volume" value="2.5"/>
      <packInfo key="netWeight" originalValue="25.0"/>
    </bskArticle>
  </items></cutBuffer>`);

  const { volumes, weights } = computeShippingInputs(
    { "Raum 1": doc1, "Raum 2": doc2 },
    x,
  );

  expect(volumes).toEqual([1.0, 2.5]);
  expect(weights).toEqual([10.0, 25.0]);
});

test("computeShippingInputs total volume drives the shipping cost approximation", () => {
  const doc = parseXml(`<cutBuffer><items>
    <bskArticle>
      <packInfo key="volume" value="1.0"/>
      <packInfo key="netWeight" originalValue="10.0"/>
    </bskArticle>
    <bskArticle>
      <packInfo key="volume" value="1.5"/>
      <packInfo key="netWeight" originalValue="15.0"/>
    </bskArticle>
  </items></cutBuffer>`);

  const { volumes, weights } = computeShippingInputs(doc, x);

  const totalVolume = volumes.filter(Boolean).reduce((s, v) => s + v, 0);
  const totalWeight = weights.filter(Boolean).reduce((s, w) => s + w, 0);
  expect(totalVolume).toBeCloseTo(2.5);
  expect(totalWeight).toBeCloseTo(25.0);
  // ceil(2.5)=3, 3*140=420, max(420,200)=420
  expect(Math.max(Math.ceil(totalVolume) * 140, 200)).toBe(420);
});

test("computeShippingInputs minimum shipping cost for small volume", () => {
  const doc = parseXml(`<cutBuffer><items>
    <bskArticle>
      <packInfo key="volume" value="0.5"/>
      <packInfo key="netWeight" originalValue="5.0"/>
    </bskArticle>
  </items></cutBuffer>`);

  const { volumes } = computeShippingInputs(doc, x);
  const totalVolume = volumes.filter(Boolean).reduce((s, v) => s + v, 0);
  // ceil(0.5)=1, 1*140=140, max(140,200)=200 → minimum applies
  expect(Math.max(Math.ceil(totalVolume) * 140, 200)).toBe(200);
});
