import { beforeEach, expect, mock, test } from "bun:test";
import { koettermannLogin, koettermannShippingPrice } from "./api.ts";

const mockFetch = mock(async () => ({
  ok: true,
  json: async () => ({}),
}));

beforeEach(() => {
  mockFetch.mockClear();
});

test("koettermannLogin sends correct request and returns sessionid", async () => {
  mockFetch.mockImplementation(async () => ({
    ok: true,
    json: async () => ({ sessionid: "abc-123" }),
  }));

  const result = await koettermannLogin(
    "user@example.com",
    "secret",
    mockFetch as unknown as typeof globalThis.fetch,
  );

  expect(result).toBe("abc-123");

  const [url, opts] = mockFetch.mock.calls[0] as [
    string,
    { method: string; body: string; headers: Record<string, string> },
  ];
  expect(url).toContain("koettermann.iw-erp.de/api/logins");
  expect(url).toContain("downgrade=1");
  expect(url).toContain("iw-build-id=");
  expect(url).toContain("iw-package-id=customer_erp_ui");
  expect(opts.method).toBe("POST");
  expect(JSON.parse(opts.body)).toEqual({
    login: { username: "user@example.com", password: "secret" },
  });
  expect(opts.headers["x-iw-convert-to-camel-case"]).toBe("1");
  expect(opts.headers["Content-Type"]).toBe("application/json");
});

test("koettermannLogin throws on non-ok response", async () => {
  mockFetch.mockImplementation(async () => ({
    ok: false,
    status: 401,
    json: async () => ({}),
  }));

  await expect(
    koettermannLogin(
      "user@example.com",
      "wrong",
      mockFetch as unknown as typeof globalThis.fetch,
    ),
  ).rejects.toThrow("Koettermann login failed (401)");
});

test("koettermannShippingPrice builds correct URL and returns nettoValue", async () => {
  mockFetch.mockImplementation(async () => ({
    ok: true,
    json: async () => ({ nettoValue: 280 }),
  }));

  const result = await koettermannShippingPrice(
    "my-token",
    "DE",
    "24103",
    2,
    mockFetch as unknown as typeof globalThis.fetch,
  );

  expect(result).toBe(280);

  const [url, opts] = mockFetch.mock.calls[0] as [
    string,
    { method: string; headers: Record<string, string> },
  ];
  expect(url).toContain("/calculate/DE/24103/shipping-volume");
  expect(url).toContain("quantity=2");
  expect(url).toContain("iw-build-id=");
  expect(opts.method).toBe("GET");
  expect(opts.headers["x-session-token"]).toBe("my-token");
  expect(opts.headers["x-iw-convert-to-camel-case"]).toBe("1");
});

test("koettermannShippingPrice throws on non-ok response", async () => {
  mockFetch.mockImplementation(async () => ({
    ok: false,
    status: 403,
    json: async () => ({}),
  }));

  await expect(
    koettermannShippingPrice(
      "bad-token",
      "DE",
      "12345",
      1,
      mockFetch as unknown as typeof globalThis.fetch,
    ),
  ).rejects.toThrow("Koettermann price fetch failed (403)");
});

test("koettermannShippingPrice passes fractional volume in URL", async () => {
  mockFetch.mockImplementation(async () => ({
    ok: true,
    json: async () => ({ nettoValue: 400 }),
  }));

  await koettermannShippingPrice(
    "token",
    "DE",
    "10117",
    2.5,
    mockFetch as unknown as typeof globalThis.fetch,
  );

  const [url] = mockFetch.mock.calls[0] as [string];
  expect(url).toContain("quantity=2.5");
});

test("koettermannShippingPrice uses provided country code in URL", async () => {
  mockFetch.mockImplementation(async () => ({
    ok: true,
    json: async () => ({ nettoValue: 350 }),
  }));

  await koettermannShippingPrice(
    "token",
    "AT",
    "1010",
    1,
    mockFetch as unknown as typeof globalThis.fetch,
  );

  const [url] = mockFetch.mock.calls[0] as [string];
  expect(url).toContain("/calculate/AT/1010/shipping-volume");
});

const liveUsername = process.env.KOETTERMANN_USERNAME ?? "";
const livePassword = process.env.KOETTERMANN_PASSWORD ?? "";
const liveTest = liveUsername && livePassword ? test : test.skip;

liveTest("live: koettermannLogin returns a session token", async () => {
  const token = await koettermannLogin(liveUsername, livePassword, fetch);
  expect(typeof token).toBe("string");
  expect(token.length).toBeGreaterThan(0);
});

liveTest(
  "live: koettermannShippingPrice returns a price for Berlin",
  async () => {
    const token = await koettermannLogin(liveUsername, livePassword, fetch);
    const price = await koettermannShippingPrice(
      token,
      "DE",
      "10707",
      1,
      fetch,
    );
    expect(typeof price).toBe("number");
    expect(price).toBeGreaterThan(0);
  },
);
