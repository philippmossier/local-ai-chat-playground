/// <reference lib="webworker" />
import type { FromWorker, ToWorker } from "./protocol";

/**
 * Scripted stand-in for worker.ts, for browser tests (`VITE_FAKE_ENGINE=1`): same messages, no model, no network.
 * A load finishes in a few ticks. An answer is "Fake answer to: <last user message>", streamed word by word and
 * slow enough to press Stop. Commands, as the start of the user message: "/error" fails the generation,
 * "/history" answers with the roles of the messages the engine received (what context reached the model).
 */
const STEP_MS = 30;

const post = (message: FromWorker) => self.postMessage(message);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

let loaded = false;
let interrupted = false;

async function load(msg: Extract<ToWorker, { type: "load" }>) {
  const started = performance.now();
  post({ type: "status", id: msg.id, phase: "loading" });
  const total = 1000;
  for (const bytes of [500, total]) {
    await sleep(STEP_MS);
    post({ type: "progress", id: msg.id, loadedBytes: bytes, totalBytes: total });
  }
  post({ type: "status", id: msg.id, phase: "warming" });
  await sleep(STEP_MS);
  loaded = true;
  post({
    type: "loaded",
    id: msg.id,
    backend: msg.backend,
    loadMs: Math.round(performance.now() - started),
  });
}

async function generate(msg: Extract<ToWorker, { type: "generate" }>) {
  if (!loaded) throw new Error("No model is loaded.");
  const last = msg.messages.findLast((m) => m.role === "user")?.content ?? "";
  if (last.startsWith("/error")) throw new Error("Fake engine error.");

  interrupted = false;
  const started = performance.now();
  const answer = last.startsWith("/history")
    ? `Fake history: ${msg.messages.map((m) => m.role).join(" ")}`
    : `Fake answer to: ${last}`;
  const words = answer.split(" ").slice(0, msg.maxNewTokens);
  let tokens = 0;
  let firstTokenAt = started;
  for (const [i, word] of words.entries()) {
    if (interrupted) break;
    await sleep(STEP_MS);
    if (tokens === 0) firstTokenAt = performance.now();
    post({ type: "token", id: msg.id, text: i === 0 ? word : ` ${word}` });
    tokens++;
  }

  const end = performance.now();
  post({
    type: "generated",
    id: msg.id,
    stats: {
      tokens,
      // Fixed and fast, so the speed advice banner stays out of tests that are not about it.
      tokensPerSecond: 50,
      ttftMs: Math.round(firstTokenAt - started),
      totalMs: Math.round(end - started),
      interrupted,
    },
  });
}

// Same queue as worker.ts: one message at a time, interrupt skips the queue.
let queue: Promise<void> = Promise.resolve();
self.onmessage = (event: MessageEvent<ToWorker>) => {
  const msg = event.data;
  if (msg.type === "interrupt") {
    interrupted = true;
    return;
  }
  queue = queue.then(() => handle(msg));
};

async function handle(msg: Exclude<ToWorker, { type: "interrupt" }>) {
  try {
    if (msg.type === "load") await load(msg);
    else if (msg.type === "generate") await generate(msg);
    else if (msg.type === "dispose") {
      loaded = false;
      post({ type: "disposed", id: msg.id });
    }
  } catch (err) {
    post({
      type: "error",
      id: msg.id,
      message: err instanceof Error ? err.message : String(err),
    });
  }
}
