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
    setCustomers(
      await getContacts(
        localStorage.getItem("apiKey") ?? "",
        filter?.length >= 3 ? filter : undefined,
      ),
    );
  }

  return (
    <label className="customer-input-label">
      Kunde
      <Combobox onChange={onChange} onClose={() => {}}>
        <ComboboxInput
          placeholder="Testkunde"
          displayValue={(customer: Address) => customer?.name}
          onChange={(ev) => void fetchCustomers(ev.target.value)}
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
