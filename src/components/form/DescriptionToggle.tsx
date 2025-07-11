export function DescriptionToggle() {
  return (
    <label>
      Beschreibungen
      <select>
        <option value="long">{"Langform in extra Zeile(n)"}</option>
        <option value="short">
          {"Kurzform in Beschreibung des Produktes"}
        </option>
      </select>
    </label>
  );
}
