export function DescriptionToggle({ value, onChange }: Props) {
  return (
    <label className="contents text-sm">
      Beschreibungen
      <select
        value={value ? "long" : "short"}
        onChange={(e) => onChange(e.currentTarget.value === "long")}
        className="w-full appearance-none rounded-md border border-gray-300 bg-white px-3 py-1.5 shadow focus:border-blue-500"
      >
        <option value="long">{"Langform in extra Zeile(n)"}</option>
        <option value="short">
          {"Kurzform in Beschreibung des Produktes"}
        </option>
      </select>
    </label>
  );
}

interface Props {
  value: boolean;
  onChange: (value: boolean) => void;
}
