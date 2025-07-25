export function GroupingToggle({ onChange }: Props) {
  return (
    <label className="flex items-center justify-between text-sm">
      Produkte mit gleichem Preis und Text
      <select
        onChange={(e) => onChange(e.currentTarget.value === "y")}
        className="w-sm py-1.5 px-3 rounded-md border border-gray-300 bg-white shadow focus:border-blue-500 appearance-none"
      >
        <option value="y">{"Gruppiert (eine Zeile mit Stückzahl > 1)"}</option>
        <option value="n">
          {"Nicht gruppiert (je eine Zeile mit Stückzahl = 1)"}
        </option>
      </select>
    </label>
  );
}

interface Props {
  onChange: (value: boolean) => void;
}
