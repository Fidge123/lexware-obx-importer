export function DescriptionToggle({ onChange }: Props) {
  return (
    <label>
      Beschreibungen
      <select onChange={(e) => onChange(e.currentTarget.value === "long")}>
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
