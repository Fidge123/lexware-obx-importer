import { beforeEach, describe, expect, test } from "bun:test";
import {
  APP_NAME,
  BATCH_SIZE,
  createRecorder,
  ENABLED_KEY,
  INSTALL_ID_KEY,
  MAX_BUFFERED_EVENTS,
  PENDING_KEY,
  POSTHOG_ENDPOINT,
  type PostHogEvent,
  type Sender,
} from "./recorder.ts";

const context = { appVersion: "0.2.2", osName: "macos", osVersion: "15.3" };

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => void values.set(key, value),
  };
}

function pending(storage: ReturnType<typeof memoryStorage>): PostHogEvent[] {
  return JSON.parse(storage.getItem(PENDING_KEY) ?? "[]");
}

let storage: ReturnType<typeof memoryStorage>;
let sent: { api_key: string; batch: PostHogEvent[] }[];
let ok: boolean;
const send: Sender = async (body) => {
  sent.push(JSON.parse(body));
  return { ok };
};

beforeEach(() => {
  storage = memoryStorage();
  sent = [];
  ok = true;
});

describe("consent", () => {
  test("records nothing while telemetry is disabled", () => {
    const recorder = createRecorder({ apiKey: "phc", storage, context, send });

    recorder.appStarted(100);

    expect(pending(storage)).toEqual([]);
    expect(storage.getItem(INSTALL_ID_KEY)).toBeNull();
  });

  test("records nothing without a build-time key", () => {
    storage.setItem(ENABLED_KEY, "true");
    const recorder = createRecorder({
      apiKey: undefined,
      storage,
      context,
      send,
    });

    recorder.appStarted(100);

    expect(pending(storage)).toEqual([]);
  });

  test("records events once telemetry is enabled", () => {
    storage.setItem(ENABLED_KEY, "true");
    const recorder = createRecorder({ apiKey: "phc", storage, context, send });

    recorder.appStarted(100);

    expect(pending(storage).map(({ event }) => event)).toEqual(["app_started"]);
  });
});

describe("install identity", () => {
  test("a random UUID is generated once and reused", () => {
    storage.setItem(ENABLED_KEY, "true");
    const recorder = createRecorder({ apiKey: "phc", storage, context, send });

    recorder.appStarted(1);
    recorder.appStarted(2);

    const [first, second] = pending(storage);
    expect(first.distinct_id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
    expect(second.distinct_id).toBe(first.distinct_id);
    expect(storage.getItem(INSTALL_ID_KEY)).toBe(first.distinct_id);
  });
});

describe("events", () => {
  test("every event carries the app name and context", () => {
    storage.setItem(ENABLED_KEY, "true");
    const recorder = createRecorder({ apiKey: "phc", storage, context, send });

    recorder.operationCompleted("create_quotation", "lexware", true, 41.6);

    expect(pending(storage)[0].properties).toEqual({
      operation: "create_quotation",
      integration: "lexware",
      success: true,
      duration_ms: 42,
      app: APP_NAME,
      app_version: "0.2.2",
      os_name: "macos",
      os_version: "15.3",
    });
  });

  test("error messages keep their details without credentials", () => {
    storage.setItem(ENABLED_KEY, "true");
    const recorder = createRecorder({ apiKey: "phc", storage, context, send });

    recorder.errorOccurred(
      "create_quotation",
      "lexware",
      new TypeError("Kunde Musterbau abgelehnt: Authorization: Bearer abc123"),
    );

    const { properties } = pending(storage)[0];
    expect(properties.code).toBe("TypeError");
    expect(properties.message).toBe(
      "Kunde Musterbau abgelehnt: Authorization: Bearer [redacted]",
    );
  });
});

describe("delivery", () => {
  test("flush sends pending events in one batch to the EU endpoint", async () => {
    storage.setItem(ENABLED_KEY, "true");
    const recorder = createRecorder({ apiKey: "phc", storage, context, send });
    recorder.appStarted(1);
    recorder.appStarted(2);

    await recorder.flush();

    expect(POSTHOG_ENDPOINT).toBe("https://eu.i.posthog.com/batch/");
    expect(sent).toHaveLength(1);
    expect(sent[0].api_key).toBe("phc");
    expect(sent[0].batch).toHaveLength(2);
    expect(pending(storage)).toEqual([]);
  });

  test("reaching the batch size triggers a flush", async () => {
    storage.setItem(ENABLED_KEY, "true");
    const recorder = createRecorder({ apiKey: "phc", storage, context, send });

    for (let index = 0; index < BATCH_SIZE; index++) {
      recorder.appStarted(index);
    }
    await recorder.flush();

    expect(sent[0].batch).toHaveLength(BATCH_SIZE);
  });

  test("a failed batch is retried once and then dropped", async () => {
    storage.setItem(ENABLED_KEY, "true");
    const recorder = createRecorder({ apiKey: "phc", storage, context, send });
    recorder.appStarted(1);
    ok = false;

    await recorder.flush();
    expect(pending(storage)).toHaveLength(1);

    await recorder.flush();
    expect(sent).toHaveLength(2);
    expect(sent[1]).toEqual(sent[0]);
    expect(pending(storage)).toEqual([]);
  });

  test("the buffer drops the oldest events at the cap", () => {
    storage.setItem(ENABLED_KEY, "true");
    const recorder = createRecorder({
      apiKey: "phc",
      storage,
      context,
      send: () => new Promise(() => {}),
    });

    for (let index = 0; index < MAX_BUFFERED_EVENTS + 5; index++) {
      recorder.appStarted(index);
    }

    const events = pending(storage);
    expect(events).toHaveLength(MAX_BUFFERED_EVENTS);
    expect(events[0].properties.duration_ms).toBe(5);
  });

  test("nothing is sent once telemetry is disabled", async () => {
    storage.setItem(ENABLED_KEY, "true");
    const recorder = createRecorder({ apiKey: "phc", storage, context, send });
    recorder.appStarted(1);
    storage.setItem(ENABLED_KEY, "false");

    await recorder.flush();

    expect(sent).toEqual([]);
  });
});

const liveApiKey = process.env.VITE_POSTHOG_API_KEY ?? "";
const liveTest = liveApiKey ? test : test.skip;

liveTest("live: PostHog accepts a batch", async () => {
  storage.setItem(ENABLED_KEY, "true");
  storage.setItem(INSTALL_ID_KEY, "lexware-obx-importer-integration-test");
  let status = 0;
  const recorder = createRecorder({
    apiKey: liveApiKey,
    storage,
    context,
    send: async (body) => {
      const response = await fetch(POSTHOG_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });
      status = response.status;
      return response;
    },
  });
  recorder.appStarted(1);

  await recorder.flush();

  expect(status).toBe(200);
});
