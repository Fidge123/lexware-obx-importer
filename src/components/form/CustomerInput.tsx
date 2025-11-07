import {
  Combobox,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from "@headlessui/react";
import { useEffect, useState } from "react";
import { getContacts } from "../../api";
import type { Address } from "../../types";

export function CustomerInput({ onChange }: Props) {
  const [customers, setCustomers] = useState<Address[]>([]);

  useEffect(() => {
    void fetchCustomers("");
  }, []);

  async function fetchCustomers(filter: string): Promise<void> {
    if (filter.length < 3) {
      setCustomers([]);
    } else {
      setCustomers(
        await getContacts(localStorage.getItem("apiKey") ?? "", filter),
      );
    }
  }

  return (
    <label className="flex items-center justify-between text-sm">
      Kunde
      <Combobox onChange={onChange}>
        <ComboboxInput
          placeholder="Testkunde"
          displayValue={(customer: Address) =>
            customer
              ? `${customer?.name} (${customer?.street}, ${customer?.city})`
              : ""
          }
          onChange={(ev) => void fetchCustomers(ev.target.value)}
          className="w-sm py-1.5 px-3 rounded-md border border-gray-300 bg-white shadow focus:border-blue-500"
        />
        <ComboboxOptions
          anchor="bottom"
          className="rounded shadow border border-gray-300 empty:invisible"
        >
          {customers.map((customer, i) => (
            <ComboboxOption
              key={customer.contactId ?? i}
              value={customer}
              className="data-focus:bg-blue-200 px-3 py-1 bg-white text-md flex justify-between items-center w-md"
            >
              <span className="max-w-sm">{customer.name}</span>
              <small className="text-xs text-gray-400 text-right pl-2 flex flex-col">
                <span className="break-after-avoid">
                  {customer.street?.replace(/Stra[ßs]s?e/, "Str.")}
                </span>
                <span className="break-after-avoid">{`${customer.zip} ${customer.city}`}</span>
              </small>
            </ComboboxOption>
          ))}
        </ComboboxOptions>
      </Combobox>
    </label>
  );
}

interface Props {
  onChange: (customer?: Address) => void;
}
