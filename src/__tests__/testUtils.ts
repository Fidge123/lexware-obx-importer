import type {
  Address,
  ContactsResponse,
  CustomLineItem,
  Quotation,
} from "../types";

export const mockAddress: Address = {
  contactId: "test-contact-123",
  name: "Test Kunde GmbH",
  street: "Teststraße 1",
  city: "Berlin",
  zip: "10115",
  countryCode: "DE",
};

export const createMockQuotation = (
  overrides?: Partial<Quotation>,
): Quotation => ({
  voucherDate: "2024-01-01T00:00:00.000Z",
  expirationDate: "2024-01-15T00:00:00.000Z",
  address: mockAddress,
  lineItems: [],
  totalPrice: { currency: "EUR" },
  taxConditions: { taxType: "net" },
  ...overrides,
});

export const createMockLineItem = (name = "Test Item"): CustomLineItem => ({
  type: "custom",
  name,
  description: "Test description",
  quantity: 1,
  unitName: "Stk.",
  unitPrice: {
    currency: "EUR",
    netAmount: 100,
    taxRatePercentage: 19,
  },
});

// Mock response from Lexware Contacts API
export const mockContactsResponse: ContactsResponse = {
  content: [
    {
      id: "e9066f04-8cc7-4616-93f8-ac9ecc8479c8",
      roles: { customer: true },
      company: { name: "Testfirma GmbH" },
      addresses: {
        billing: [
          {
            name: "Testfirma GmbH",
            street: "Hauptstr. 5",
            zip: "12345",
            city: "Musterort",
            countryCode: "DE",
          },
        ],
      },
    },
    {
      id: "313ef116-a432-4823-9dfe-1b1200eb458a",
      roles: { customer: true },
      person: { firstName: "Max", lastName: "Mustermann" },
      addresses: {
        billing: [
          {
            name: "Max Mustermann",
            street: "Musterweg 10",
            zip: "54321",
            city: "Teststadt",
            countryCode: "DE",
          },
        ],
      },
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

// Mock successful quotation creation response
export const mockQuotationCreatedResponse = {
  id: "424f784e-1f4e-439e-8f71-19673e6d6583",
  voucherNumber: "AG0001",
  voucherStatus: "open",
};
