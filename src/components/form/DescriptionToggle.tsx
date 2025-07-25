export function DescriptionToggle({ onChange }: Props) {
  return (
    <label className="flex items-center justify-between text-sm">
      Beschreibungen
      <select
        onChange={(e) => onChange(e.currentTarget.value === "long")}
        className="w-sm py-1.5 px-3 rounded-md border border-gray-300 bg-white shadow focus:border-blue-500 appearance-none"
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
