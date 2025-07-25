import { useEffect, useState } from "react";
import { getContacts } from "../../api";
import { Address } from "../../types";
import {
  Combobox,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from "@headlessui/react";

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
      <Combobox onChange={onChange} onClose={() => {}}>
        <ComboboxInput
          placeholder="Testkunde"
          displayValue={(customer: Address) => customer?.name}
          onChange={(ev) => void fetchCustomers(ev.target.value)}
          className="w-sm py-1.5 px-3 rounded-md border border-gray-300 bg-white shadow focus:border-blue-500"
        />
        <ComboboxOptions anchor="bottom" className="border empty:invisible">
          {customers.map((customer, i) => (
            <ComboboxOption
              key={customer.contactId ?? i}
              value={customer}
              className="data-focus:bg-blue-100"
            >
              {customer.name}
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
