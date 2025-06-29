export function BasicFormInput({
  name,
  placeholder,
  value,
  setValue,
  type = "text",
}: TextProps | NumberProps) {
  return (
    <label>
      {name}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        autoComplete="off"
      />
      <div id="customer-dropdown" className="customer-dropdown">
        <div class="loading-indicator" style="display: none">
          Lädt...
        </div>
        <ul id="customer-list"></ul>
      </div>
    </label>
  );
}

interface TextProps {
  name: string;
  type?: "text";
  placeholder?: string;
  value: string;
  setValue: (value: string) => void;
}

interface NumberProps {
  name: string;
  type?: "number";
  placeholder?: never;
  value: number;
  setValue: (value: number) => void;
}
