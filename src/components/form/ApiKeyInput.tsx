import { useState, useEffect } from "react";

export function ApiKeyInput() {
  const [key, setKey] = useState(() => {
    return localStorage.getItem("apiKey") ?? "";
  });

  useEffect(() => {
    localStorage.setItem("apiKey", key);
  }, [key]);

  return (
    <label>
      API Key
      <input
        type="password"
        autoComplete="off"
        value={key}
        onChange={(e) => setKey(e.target.value)}
      />
    </label>
  );
}
