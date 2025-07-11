export function MultiplierInput({ onChange }: Props) {
  return (
    <label>
      Aufschlag in %
      <input
        type="number"
        autoComplete="off"
        defaultValue={0}
        step={0.1}
        onChange={(e) => onChange(e.target.valueAsNumber ?? 0)}
      />
    </label>
  );
}

interface Props {
  onChange: (value: number) => void;
}
