import { getVersion } from "@tauri-apps/api/app";
import { fetch } from "@tauri-apps/plugin-http";
import { platform, version } from "@tauri-apps/plugin-os";
import {
  createRecorder,
  ENABLED_KEY,
  type Integration,
  type Operation,
  PENDING_KEY,
  POSTHOG_ENDPOINT,
  type Recorder,
} from "./recorder.ts";

const FLUSH_INTERVAL_MS = 30_000;

let recorder: Recorder | undefined;

/** Without a key at build time nothing is recorded or sent. */
export async function initTelemetry() {
  recorder = createRecorder({
    apiKey: import.meta.env.VITE_POSTHOG_API_KEY,
    storage: localStorage,
    context: {
      appVersion: await getVersion(),
      osName: platform(),
      osVersion: version(),
    },
    send: (body) =>
      fetch(POSTHOG_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      }),
  });

  recorder.appStarted(performance.now());
  window.addEventListener("error", (event) =>
    recorder?.errorOccurred(
      "frontend_uncaught_error",
      "frontend",
      event.error ?? event.message,
    ),
  );
  window.addEventListener("unhandledrejection", (event) =>
    recorder?.errorOccurred(
      "frontend_promise_rejection",
      "frontend",
      event.reason,
    ),
  );
  setInterval(() => void recorder?.flush(), FLUSH_INTERVAL_MS);
  void recorder.flush();
}

export function isTelemetryEnabled() {
  return localStorage.getItem(ENABLED_KEY) === "true";
}

export function setTelemetryEnabled(enabled: boolean) {
  localStorage.setItem(ENABLED_KEY, String(enabled));
  if (!enabled) {
    localStorage.removeItem(PENDING_KEY);
  }
}

export async function observe<T>(
  operation: Operation,
  integration: Integration,
  run: () => Promise<T>,
): Promise<T> {
  const startedAt = performance.now();
  try {
    const result = await run();
    recorder?.operationCompleted(
      operation,
      integration,
      true,
      performance.now() - startedAt,
    );
    return result;
  } catch (error) {
    recorder?.operationCompleted(
      operation,
      integration,
      false,
      performance.now() - startedAt,
    );
    recorder?.errorOccurred(operation, integration, error);
    throw error;
  }
}
