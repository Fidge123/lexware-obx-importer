export function GroupingToggle({ onChange }: Props) {
  return (
    <label className="contents text-balance text-sm">
      Darstellung gleicher Produkte
      <select
        onChange={(e) => onChange(e.currentTarget.value === "y")}
        className="w-full appearance-none rounded-md border border-gray-300 bg-white px-3 py-1.5 shadow focus:border-blue-500"
      >
        <option value="y">{"Gruppiert (eine Zeile mit Stückzahl > 1)"}</option>
        <option value="n">{"Einzeln (je eine Zeile mit Stückzahl = 1)"}</option>
      </select>
    </label>
  );
}

interface Props {
  onChange: (value: boolean) => void;
}
