export function InputField({ label, type, value, onChange }: Props) {
  return (
    <label className="flex items-center gap-4 text-sm">
      {label}
      <input
        type={type}
        value={value}
        min={0}
        onChange={(e) => onChange(e.target.value)}
        className="w-32 rounded-lg border border-gray-300 px-2 py-1 transition-all focus:ring-2 focus:ring-blue-500"
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
