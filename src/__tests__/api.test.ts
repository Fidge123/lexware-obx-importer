import { describe, expect, it, vi } from "vitest";
import { createQuotation, getContacts } from "../api";
import {
  createMockQuotation,
  mockContactsResponse,
  mockQuotationCreatedResponse,
} from "./testUtils";

// Mock fetch function factory
const createMockFetch = (responseData: unknown, status = 200) => {
  return vi.fn().mockResolvedValue({
    status,
    ok: status >= 200 && status < 300,
    json: vi.fn().mockResolvedValue(responseData),
    text: vi.fn().mockResolvedValue(JSON.stringify(responseData)),
  });
};

describe("API Layer", () => {
  describe("createQuotation", () => {
    it("should create a quotation and return the ID", async () => {
      const mockFetch = createMockFetch(mockQuotationCreatedResponse, 201);
      const quotation = createMockQuotation();

      const result = await createQuotation(
        quotation,
        "test-api-key",
        mockFetch,
      );

      expect(result).toBe("424f784e-1f4e-439e-8f71-19673e6d6583");
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.lexware.io/v1/quotations",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer test-api-key",
            "Content-Type": "application/json",
          }),
        }),
      );
    });

    it("should include quotation data in request body", async () => {
      const mockFetch = createMockFetch(mockQuotationCreatedResponse, 201);
      const quotation = createMockQuotation({
        address: { name: "Custom Customer", countryCode: "DE" },
      });

      await createQuotation(quotation, "test-api-key", mockFetch);

      const calledBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(calledBody.address.name).toBe("Custom Customer");
    });
  });

  describe("getContacts", () => {
    it("should fetch contacts with customer filter", async () => {
      const mockFetch = createMockFetch(mockContactsResponse);

      const result = await getContacts("test-api-key", undefined, mockFetch);

      expect(result).toHaveLength(2);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("customer=true"),
        expect.anything(),
      );
    });

    it("should fetch contacts with name filter", async () => {
      const mockFetch = createMockFetch(mockContactsResponse);

      await getContacts("test-api-key", "Muster", mockFetch);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("name=Muster"),
        expect.anything(),
      );
    });

    it("should transform contact response into Address array", async () => {
      const mockFetch = createMockFetch(mockContactsResponse);

      const result = await getContacts("test-api-key", undefined, mockFetch);

      expect(result[0]).toMatchObject({
        contactId: "e9066f04-8cc7-4616-93f8-ac9ecc8479c8",
        name: "Testfirma GmbH",
        countryCode: "DE",
      });
      expect(result[1]).toMatchObject({
        contactId: "313ef116-a432-4823-9dfe-1b1200eb458a",
        name: "Max Mustermann",
      });
    });

    it("should handle empty results", async () => {
      const mockFetch = createMockFetch({
        ...mockContactsResponse,
        content: [],
        totalElements: 0,
      });

      const result = await getContacts(
        "test-api-key",
        "NonExistent",
        mockFetch,
      );

      expect(result).toHaveLength(0);
    });

    it("should include authorization header", async () => {
      const mockFetch = createMockFetch(mockContactsResponse);

      await getContacts("my-secret-key", undefined, mockFetch);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer my-secret-key",
          }),
        }),
      );
    });
  });
});
