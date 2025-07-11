export function GroupingToggle({ onChange }: Props) {
  return (
    <label>
      Produkte mit gleichem Preis und Text
      <select onChange={(e) => onChange(e.currentTarget.value === "y")}>
        <option value="y">{"Gruppiert (eine Zeile mit Stückzahl > 1)"}</option>
        <option value="n">
          {"Nicht gruppiert (je eine Zeile mit Stückzahl = 1"}
        </option>
      </select>
    </label>
  );
}

interface Props {
  onChange: (value: boolean) => void;
}
