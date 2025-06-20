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

export interface Address {
  contactId?: string;
  name?: string;
  supplement?: string;
  street?: string;
  city?: string;
  zip?: string;
  countryCode?: string;
}

export interface Contact {
  id: string;
  roles:
    | {
        customer: true;
      }
    | {
        vendor: true;
      };
  company?: {
    name: string;
    taxNumber?: string;
    vatRegistrationId?: string;
  };
  person?: {
    firstName?: string;
    lastName?: string;
    salutation?: string;
    title?: string;
  };
  addresses?: {
    billing?: Address[];
    shipping?: Address[];
  };
  archived?: boolean;
}

export interface ContactsResponse {
  content: Contact[];
  first: boolean;
  last: boolean;
  totalPages: number;
  totalElements: number;
  numberOfElements: number;
  size: number;
  number: number;
}

export interface ContactListItem {
  id: string;
  name: string;
  address?: Address;
}
