import { expect, test } from "bun:test";
import { getContacts, kmLogin, kmShippingPrice } from "./api.ts";

const liveApiToken = process.env.LEXWARE_TOKEN ?? "";
const liveApiTest = liveApiToken ? test : test.skip;

liveApiTest("live: getContacts returns contacts from Lexware API", async () => {
  const contacts = await getContacts(liveApiToken, undefined, fetch);
  expect(Array.isArray(contacts)).toBe(true);
  if (contacts.length > 0) {
    expect(typeof contacts[0].name).toBe("string");
    expect(typeof contacts[0].countryCode).toBe("string");
  }
});

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
