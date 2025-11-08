import {
  Combobox,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from "@headlessui/react";
import { useCallback, useEffect, useState } from "react";
import { getContacts } from "../../api";
import type { Address } from "../../types";

export function CustomerInput({ onChange }: Props) {
  const [customers, setCustomers] = useState<Address[]>([]);

  const fetchCustomers = useCallback(async (filter: string): Promise<void> => {
    if (filter.length < 3) {
      setCustomers([]);
    } else {
      setCustomers(
        await getContacts(localStorage.getItem("apiKey") ?? "", filter),
      );
    }
  }, []);

  useEffect(() => {
    void fetchCustomers("");
  }, [fetchCustomers]);

  const handleComboboxChange = (value: Address | null | undefined) => {
    onChange(value ?? undefined);
  };

  return (
    <div className="flex items-center justify-between text-sm">
      <span>Kunde</span>
      <Combobox onChange={handleComboboxChange}>
        <ComboboxInput
          placeholder="Testkunde"
          displayValue={(customer: Address) =>
            customer
              ? `${customer?.name} (${customer?.street}, ${customer?.city})`
              : ""
          }
          onChange={(ev) => void fetchCustomers(ev.target.value)}
          className="w-sm rounded-md border border-gray-300 bg-white px-3 py-1.5 shadow focus:border-blue-500"
        />
        <ComboboxOptions
          anchor="bottom"
          className="rounded border border-gray-300 shadow empty:invisible"
        >
          {customers.map((customer, i) => (
            <ComboboxOption
              key={customer.contactId ?? i}
              value={customer}
              className="flex w-md items-center justify-between bg-white px-3 py-1 text-md data-focus:bg-blue-200"
            >
              <span className="max-w-sm">{customer.name}</span>
              <small className="flex flex-col pl-2 text-right text-gray-400 text-xs">
                <span className="break-after-avoid">
                  {customer.street?.replace(/Stra[ßs]s?e/, "Str.")}
                </span>
                <span className="break-after-avoid">{`${customer.zip} ${customer.city}`}</span>
              </small>
            </ComboboxOption>
          ))}
        </ComboboxOptions>
      </Combobox>
    </div>
  );
}

interface Props {
  onChange: (customer?: Address) => void;
}
