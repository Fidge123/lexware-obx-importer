import { useState, useEffect } from "react";

export function ApiKeyInput({ onChange }: Props) {
  const [key, setKey] = useState(() => {
    return localStorage.getItem("apiKey") ?? "";
  });

  useEffect(() => {
    localStorage.setItem("apiKey", key);
    onChange(key);
  }, [key, onChange]);

  return (
    <label className="flex items-center justify-between text-sm">
      API Key
      <input
        type="password"
        autoComplete="off"
        value={key}
        onChange={(e) => setKey(e.target.value)}
        className="w-sm py-1.5 px-3 rounded-md border border-gray-300 bg-white shadow focus:border-blue-500"
      />
    </label>
  );
}

interface Props {
  onChange: (customer: string) => void;
}
