import { expect, test } from "bun:test";
import { kmLogin, kmShippingPrice } from "./api.ts";

const liveUsername = process.env.KM_USERNAME ?? "";
const livePassword = process.env.KM_PASSWORD ?? "";
const liveTest = liveUsername && livePassword ? test : test.skip;

liveTest("live: kmLogin returns a session token", async () => {
  const token = await kmLogin(liveUsername, livePassword, fetch);
  expect(typeof token).toBe("string");
  expect(token.length).toBeGreaterThan(0);
});

liveTest("live: kmShippingPrice returns a price for Berlin", async () => {
  const token = await kmLogin(liveUsername, livePassword, fetch);
  const price = await kmShippingPrice(token, "10115", 1, fetch);
  expect(typeof price).toBe("number");
  expect(price).toBeGreaterThan(0);
});
