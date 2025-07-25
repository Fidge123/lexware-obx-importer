export function InputField({ label, type, value, onChange }: Props) {
  return (
    <label className="flex gap-4 items-center text-sm">
      {label}
      <input
        type={type}
        value={value}
        min={0}
        onChange={(e) => onChange(e.target.value)}
        className="border border-gray-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-blue-500 transition-all w-32"
      />
    </label>
  );
}

interface Props {
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
}
