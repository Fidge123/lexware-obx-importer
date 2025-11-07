export function DescriptionToggle({ onChange }: Props) {
  return (
    <label className="flex items-center justify-between text-sm">
      Beschreibungen
      <select
        onChange={(e) => onChange(e.currentTarget.value === "long")}
        className="w-sm appearance-none rounded-md border border-gray-300 bg-white px-3 py-1.5 shadow focus:border-blue-500"
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
  onChange: (value: boolean) => void;
}
