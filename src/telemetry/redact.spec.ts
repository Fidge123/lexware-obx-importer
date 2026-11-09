import { describe, expect, test } from "bun:test";
import { sanitize } from "./redact.ts";

describe("sanitize", () => {
  test("keeps URLs, paths and the description", () => {
    const message =
      "Zeitüberschreitung bei /v1/quotations: error sending request for url (https://api.lexware.io/v1/quotations)";

    expect(sanitize(message)).toBe(message);
  });

  test("keeps e-mail addresses", () => {
    const message = "Login für flori@hey.com abgelehnt";

    expect(sanitize(message)).toBe(message);
  });

  test("redacts a credential in a URL query and keeps the rest of the URL", () => {
    expect(
      sanitize(
        "error sending request for url (https://api.example.com/v1/refresh_token?refresh_token=r3fr3sh&scope=all)",
      ),
    ).toBe(
      "error sending request for url (https://api.example.com/v1/refresh_token?refresh_token=[redacted]&scope=all)",
    );
  });

  test("redacts credentials in a JSON body", () => {
    expect(
      sanitize(
        `body={"access_token":"acc355","refresh_token":"r3fr3sh","expires_in":0}`,
      ),
    ).toBe(
      `body={"access_token":"[redacted]","refresh_token":"[redacted]","expires_in":0}`,
    );
  });

  test("redacts credentials in JSON with spaces", () => {
    expect(sanitize(`{ "password": "hunter2", "user": "flori" }`)).toBe(
      `{ "password": "[redacted]", "user": "flori" }`,
    );
  });

  test("redacts a credential cut off by truncation to the end", () => {
    expect(sanitize(`body={"expires_in":0,"access_token":"acc355_cut...`)).toBe(
      `body={"expires_in":0,"access_token":"[redacted]`,
    );
  });

  test("redacts credentials in a URL authority", () => {
    expect(
      sanitize("GET https://user:pa55@koettermann.iw-erp.de/api failed"),
    ).toBe("GET https://[redacted]@koettermann.iw-erp.de/api failed");
  });

  test("redacts bearer values and keeps the scheme", () => {
    expect(
      sanitize("Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.abc rejected"),
    ).toBe("Authorization: Bearer [redacted] rejected");
  });

  test("redacts plain credential pairs", () => {
    expect(
      sanitize("request failed token=s3cret password=hunter2 status=401"),
    ).toBe("request failed token=[redacted] password=[redacted] status=401");
  });

  test("keeps words that only end in a credential name", () => {
    const message = "hotkey=F5 monkey: banana";

    expect(sanitize(message)).toBe(message);
  });

  test("keeps plain technical descriptions intact", () => {
    const message = "Km login failed (401)";

    expect(sanitize(message)).toBe(message);
  });
});
