import { sanitize } from "./redact.ts";

export const POSTHOG_ENDPOINT = "https://eu.i.posthog.com/batch/";
/** Separates this app's events from other apps in the shared PostHog project. */
export const APP_NAME = "lexware-obx-importer";
export const BATCH_SIZE = 20;
export const MAX_BUFFERED_EVENTS = 500;

export const ENABLED_KEY = "telemetryEnabled";
export const INSTALL_ID_KEY = "telemetryInstallId";
export const PENDING_KEY = "telemetryPending";

export type Operation =
  | "create_quotation"
  | "search_contacts"
  | "km_login"
  | "km_shipping_price"
  | "frontend_uncaught_error"
  | "frontend_promise_rejection";

export type Integration = "lexware" | "koettermann" | "frontend";

export interface EventContext {
  appVersion: string;
  osName: string;
  osVersion: string;
}

export interface PostHogEvent {
  event: string;
  uuid: string;
  timestamp: string;
  distinct_id: string;
  properties: Record<string, unknown>;
}

export type Sender = (body: string) => Promise<{ ok: boolean }>;

type KeyValueStore = Pick<Storage, "getItem" | "setItem">;

interface RecorderOptions {
  apiKey: string | undefined;
  storage: KeyValueStore;
  context: EventContext;
  send: Sender;
}

export type Recorder = ReturnType<typeof createRecorder>;

/** Pending events live in storage, because a quotation import reloads the page. */
export function createRecorder({
  apiKey,
  storage,
  context,
  send,
}: RecorderOptions) {
  let flushing = false;
  let retriedBatch: string | undefined;

  const isEnabled = () => storage.getItem(ENABLED_KEY) === "true";

  const installId = () => {
    const existing = storage.getItem(INSTALL_ID_KEY);
    if (existing) {
      return existing;
    }
    const generated = crypto.randomUUID();
    storage.setItem(INSTALL_ID_KEY, generated);
    return generated;
  };

  const pending = (): PostHogEvent[] => {
    try {
      return JSON.parse(storage.getItem(PENDING_KEY) ?? "[]") as PostHogEvent[];
    } catch {
      return [];
    }
  };

  const savePending = (events: PostHogEvent[]) =>
    storage.setItem(PENDING_KEY, JSON.stringify(events));

  const record = (event: string, properties: Record<string, unknown>) => {
    if (!apiKey || !isEnabled()) {
      return;
    }

    const events = pending();
    events.push({
      event,
      uuid: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      distinct_id: installId(),
      properties: {
        ...properties,
        app: APP_NAME,
        app_version: context.appVersion,
        os_name: context.osName,
        os_version: context.osVersion,
      },
    });
    savePending(events.slice(-MAX_BUFFERED_EVENTS));

    if (events.length >= BATCH_SIZE) {
      void flush();
    }
  };

  /** A stale measurement is not worth a retry queue, so a failed batch is retried once. */
  const flush = async () => {
    if (!apiKey || flushing) {
      return;
    }
    flushing = true;
    try {
      let batch = pending().slice(0, BATCH_SIZE);
      while (batch.length > 0 && isEnabled()) {
        const delivered = await send(
          JSON.stringify({ api_key: apiKey, batch }),
        ).then(
          (response) => response.ok,
          () => false,
        );
        const batchId = batch[0].uuid;
        if (!delivered && retriedBatch !== batchId) {
          retriedBatch = batchId;
          return;
        }

        const sent = new Set(batch.map(({ uuid }) => uuid));
        savePending(pending().filter(({ uuid }) => !sent.has(uuid)));
        batch = pending().slice(0, BATCH_SIZE);
      }
    } finally {
      flushing = false;
    }
  };

  const operationCompleted = (
    operation: Operation,
    integration: Integration,
    success: boolean,
    durationMs: number,
  ) =>
    record("operation_completed", {
      operation,
      integration,
      success,
      duration_ms: Math.round(durationMs),
    });

  const errorOccurred = (
    operation: Operation,
    integration: Integration,
    error: unknown,
  ) =>
    record("error_occurred", {
      operation,
      integration,
      code: sanitize(error instanceof Error ? error.name : "unknown"),
      message: sanitize(error instanceof Error ? error.message : String(error)),
    });

  const appStarted = (durationMs: number) =>
    record("app_started", { duration_ms: Math.round(durationMs) });

  return {
    flush,
    operationCompleted,
    errorOccurred,
    appStarted,
  };
}
