export function GroupingToggle() {
  return (
    <label>
      Produkte mit gleichem Preis und Text
      <select>
        <option value="y">{"Gruppiert (eine Zeile mit Stückzahl > 1)"}</option>
        <option value="n">
          {"Nicht gruppiert (je eine Zeile mit Stückzahl = 1"}
        </option>
      </select>
    </label>
  );
}
