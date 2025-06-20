export interface TextLineItem {
  type: "text";
  name: string;
  description?: string;
}

export interface SubLineItem {
  name: string;
  description: string;
  quantity: number;
  unitPrice: {
    netAmount: number;
  };
}

export interface CustomLineItem {
  type: "custom";
  name: string;
  description: string;
  quantity: number;
  unitName: "Stk." | "Psch";
  unitPrice: {
    currency: string;
    netAmount: number;
    taxRatePercentage: number;
  };
}

export type LineItemWithType = TextLineItem | CustomLineItem;
export type LineItem = TextLineItem | CustomLineItem | SubLineItem;

export interface Quotation {
  voucherDate: string;
  expirationDate: string;
  address:
    | {
        contactId: string;
      }
    | {
        name: string;
        countryCode: string;
      };
  lineItems: LineItem[];
  totalPrice: {
    currency: string;
  };
  taxConditions: {
    taxType: "net" | "gross" | "vatfree";
  };
}
