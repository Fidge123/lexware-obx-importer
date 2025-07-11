import { useState, useRef, useEffect } from "react";
import { getContacts } from "../../api";
import { ContactListItem } from "../../types";

export function CustomerInput({ value, onChange }: Props) {
  const [customers, setCustomers] = useState<ContactListItem[]>([]);
  const [inputValue, setInputValue] = useState<string>(value?.name || "");
  const [loading, setLoading] = useState(false);
  const [dropdownActive, setDropdownActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownActive(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (customers.length > 0) setDropdownActive(true);
    else setDropdownActive(false);
  }, [customers]);

  async function fetchCustomers(filter: string): Promise<void> {
    setLoading(true);
    setCustomers(
      await getContacts(
        localStorage.getItem("apiKey") ?? "",
        filter?.length >= 3 ? filter : undefined
      )
    );
    setLoading(false);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setInputValue(val);
    void fetchCustomers(val.trim());
    if (onChange) onChange(null); // Reset selection if typing
  }

  function handleCustomerSelect(customer: ContactListItem) {
    setInputValue(customer.name);
    setCustomers([]);
    setDropdownActive(false);
    if (onChange) onChange(customer);
    inputRef.current?.blur();
  }

  // Get input position and width for dropdown
  const inputRect = inputRef.current?.getBoundingClientRect();
  const inputWidth = inputRef.current?.offsetWidth || undefined;
  const inputHeight = inputRef.current?.offsetHeight || 0;

  // Calculate dropdown position
  const dropdownStyle = inputRect
    ? {
        position: "absolute" as const,
        left: 0,
        top: inputHeight,
        zIndex: 10,
        background: "white",
        border: "1px solid #ccc",
        width: inputWidth,
        minWidth: inputWidth,
        maxWidth: inputWidth,
        display: dropdownActive ? "block" : "none",
      }
    : {};

  return (
    <label className="customer-input-label">
      Kunde
      <input
        ref={inputRef}
        type="text"
        className="customer-input-box"
        placeholder="Testkunde"
        autoComplete="off"
        disabled={!localStorage.getItem("apiKey")}
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => customers.length > 0 && setDropdownActive(true)}
      />
      <div
        ref={dropdownRef}
        id="customer-dropdown"
        className={`customer-dropdown${dropdownActive ? " active" : ""}`}
        style={dropdownStyle}
      >
        {loading && <div className="loading-indicator">Lädt...</div>}
        <ul id="customer-list" className="customer-list">
          {customers.map((customer) => (
            <li
              key={customer.id}
              className="customer-list-item"
              onClick={() => handleCustomerSelect(customer)}
            >
              {customer.name}
            </li>
          ))}
        </ul>
      </div>
    </label>
  );
}

interface Props {
  value?: ContactListItem | null;
  onChange?: (customer: ContactListItem | null) => void;
}
