import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { initTelemetry } from "./telemetry/telemetry.ts";

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root container not found");
}

void initTelemetry();

createRoot(container).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
