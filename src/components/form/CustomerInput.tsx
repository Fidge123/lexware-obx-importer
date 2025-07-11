import { useState } from "react";
import { getContacts } from "../../api";
import { ContactListItem } from "../../types";

export function CustomerInput() {
  const [customers, setCustomers] = useState<ContactListItem[]>([]);
  const [selectedContact, setSelectedContact] = useState<string>();

  async function fetchCustomers(filter: string): Promise<void> {
    setCustomers(
      await getContacts(
        localStorage.getItem("apiKey") ?? "",
        filter?.length >= 3 ? filter : undefined
      )
    );
  }

  return (
    <label>
      Kunde
      <input
        type="text"
        placeholder="Testkunde"
        autoComplete="off"
        disabled={!localStorage.getItem("apiKey")}
        onChange={(e) => void fetchCustomers(e.target.value.trim())}
      />
      <div
        id="customer-dropdown"
        className={customers.length > 0 ? "active" : ""}
      >
        <div className="loading-indicator">Lädt...</div>
        <ul id="customer-list">
          {customers.map((customer) => (
            <li
              key={customer.id}
              onClick={(e) =>
                setSelectedContact(e.currentTarget.dataset.id ?? "")
              }
            >
              {customer.name}
            </li>
          ))}
        </ul>
      </div>
      <input type="hidden" name="customerId" value={selectedContact} />
    </label>
  );
}
