import { beforeEach, expect, mock, test } from "bun:test";
import { getContacts, kmLogin, kmShippingPrice } from "./api.ts";

const mockFetch = mock(
  async (): Promise<object> => ({
    ok: true,
    json: async () => ({}),
  }),
);

beforeEach(() => {
  mockFetch.mockClear();
});

test("kmLogin sends correct request and returns sessionid", async () => {
  mockFetch.mockImplementation(async () => ({
    ok: true,
    json: async () => ({ sessionid: "tok-abc" }),
  }));

  const result = await kmLogin(
    "user@example.com",
    "secret",
    mockFetch as unknown as typeof fetch,
  );

  expect(result).toBe("tok-abc");

  const [url, opts] = mockFetch.mock.calls[0] as unknown as [
    string,
    { method: string; body: string },
  ];
  expect(url).toContain("koettermann.iw-erp.de/api/logins");
  expect(url).toContain("downgrade=1");
  expect(opts.method).toBe("POST");
  expect(JSON.parse(opts.body)).toEqual({
    login: { username: "user@example.com", password: "secret" },
  });
});

test("kmLogin throws on non-ok response", async () => {
  mockFetch.mockImplementation(async () => ({
    ok: false,
    status: 401,
  }));

  await expect(
    kmLogin("user@example.com", "wrong", mockFetch as unknown as typeof fetch),
  ).rejects.toThrow("Km login failed (401)");
});

test("kmShippingPrice builds correct URL and returns netto_value", async () => {
  mockFetch.mockImplementation(async () => ({
    ok: true,
    json: async () => ({ netto_value: 280 }),
  }));

  const result = await kmShippingPrice(
    "my-token",
    "24103",
    2,
    mockFetch as unknown as typeof fetch,
  );

  expect(result).toBe(280);

  const [url, opts] = mockFetch.mock.calls[0] as unknown as [
    string,
    { method: string; headers: Record<string, string> },
  ];
  expect(url).toContain("/calculate/DE/24103/shipping-volume");
  expect(url).toContain("quantity=2");
  expect(opts.method).toBe("GET");
  expect(opts.headers["x-session-token"]).toBe("my-token");
});

test("kmShippingPrice throws on non-ok response", async () => {
  mockFetch.mockImplementation(async () => ({
    ok: false,
    status: 403,
  }));

  await expect(
    kmShippingPrice(
      "bad-token",
      "12345",
      1,
      mockFetch as unknown as typeof fetch,
    ),
  ).rejects.toThrow("Km price fetch failed (403)");
});

const CONTACTS_RESPONSE = {
  content: [
    {
      id: "contact-1",
      roles: { customer: true },
      company: { name: "Test GmbH" },
      addresses: {
        billing: [
          {
            street: "Musterstraße 1",
            city: "München",
            zip: "80331",
            countryCode: "DE",
          },
        ],
      },
    },
    {
      id: "contact-2",
      roles: { customer: true },
      person: { firstName: "Max", lastName: "Mustermann" },
      addresses: { billing: [] },
    },
  ],
  first: true,
  last: true,
  totalPages: 1,
  totalElements: 2,
  numberOfElements: 2,
  size: 20,
  number: 0,
};

test("getContacts sends correct request with Bearer token", async () => {
  mockFetch.mockImplementation(async () => ({
    ok: true,
    status: 200,
    json: async () => CONTACTS_RESPONSE,
  }));

  await getContacts(
    "my-api-key",
    undefined,
    mockFetch as unknown as typeof fetch,
  );

  const [url, opts] = mockFetch.mock.calls[0] as unknown as [
    string,
    { method: string; headers: Record<string, string> },
  ];
  expect(url).toContain("api.lexware.io/v1/contacts");
  expect(url).toContain("customer=true");
  expect(url).toContain("page=0");
  expect(url).toContain("size=20");
  expect(opts.method).toBe("GET");
  expect(opts.headers.Authorization).toBe("Bearer my-api-key");
  expect(opts.headers.Accept).toBe("application/json");
});

test("getContacts maps company and person contacts correctly", async () => {
  mockFetch.mockImplementation(async () => ({
    ok: true,
    status: 200,
    json: async () => CONTACTS_RESPONSE,
  }));

  const result = await getContacts(
    "key",
    undefined,
    mockFetch as unknown as typeof fetch,
  );

  expect(result).toHaveLength(2);
  expect(result[0]).toMatchObject({
    contactId: "contact-1",
    name: "Test GmbH",
    street: "Musterstraße 1",
    city: "München",
    zip: "80331",
    countryCode: "DE",
  });
  expect(result[1]).toMatchObject({
    contactId: "contact-2",
    name: "Max Mustermann",
    countryCode: "DE",
  });
});

test("getContacts appends filter as name query param", async () => {
  mockFetch.mockImplementation(async () => ({
    ok: true,
    status: 200,
    json: async () => ({ ...CONTACTS_RESPONSE, content: [] }),
  }));

  await getContacts("key", "Muster", mockFetch as unknown as typeof fetch);

  const [url] = mockFetch.mock.calls[0] as unknown as [string];
  expect(url).toContain("name=Muster");
});

test("getContacts throws on non-ok response", async () => {
  mockFetch.mockImplementation(async () => ({
    ok: false,
    status: 401,
    text: async () => "Unauthorized",
  }));

  await expect(
    getContacts("bad-key", undefined, mockFetch as unknown as typeof fetch),
  ).rejects.toThrow("Unauthorized (401)");
});

const liveApiToken = process.env.LEXWARE_API_TOKEN ?? "";
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
