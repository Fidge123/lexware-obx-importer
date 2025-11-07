export function MultiplierInput({ onChange }: Props) {
  return (
    <label className="flex items-center justify-between text-sm">
      Aufschlag in %
      <input
        type="number"
        autoComplete="off"
        defaultValue={0}
        onChange={(e) => onChange(e.target.valueAsNumber ?? 0)}
        className="w-sm rounded-md border border-gray-300 bg-white px-3 py-1.5 shadow focus:border-blue-500"
      />
    </label>
  );
}

interface Props {
  onChange: (value: number) => void;
}
