import { describe, expect, it } from "vitest";
import type { GenerationStats } from "../engine/protocol";
import { type ChatAction, type ChatState, chatReducer, initialState } from "./store";

const stats: GenerationStats = {
  tokens: 3,
  tokensPerSecond: 10,
  ttftMs: 50,
  totalMs: 300,
  interrupted: false,
};

const run = (state: ChatState, actions: ChatAction[]) => actions.reduce(chatReducer, state);

const chat = (state: ChatState, id: string) => state.chats.find((c) => c.id === id);

describe("chatReducer streaming", () => {
  it("writes the streamed answer into the chat it was sent from after switching chats", () => {
    const setup = run(initialState, [
      { type: "new", id: "B", now: 1 },
      { type: "new", id: "A", now: 2 },
      { type: "send", chatId: "A", userId: "u1", assistantId: "a1", text: "Hello?", now: 3 },
      { type: "select", id: "B" },
    ]);
    expect(setup.activeId).toBe("B");
    const before = chat(setup, "B");

    const state = run(setup, [
      { type: "token", chatId: "A", messageId: "a1", text: "Hi " },
      { type: "token", chatId: "A", messageId: "a1", text: "there" },
      { type: "finish", chatId: "A", messageId: "a1", stats },
    ]);

    const answer = chat(state, "A")?.messages.find((m) => m.id === "a1");
    expect(answer?.content).toBe("Hi there");
    expect(answer?.stats).toEqual(stats);
    expect(chat(state, "B")).toEqual(before);
    expect(state.activeId).toBe("B");
  });

  it("writes the streamed answer into the active chat when it stays selected", () => {
    const state = run(initialState, [
      { type: "new", id: "B", now: 1 },
      { type: "new", id: "A", now: 2 },
      { type: "send", chatId: "A", userId: "u1", assistantId: "a1", text: "Hello?", now: 3 },
      { type: "token", chatId: "A", messageId: "a1", text: "Hi" },
      { type: "finish", chatId: "A", messageId: "a1", stats },
    ]);

    const answer = chat(state, "A")?.messages.find((m) => m.id === "a1");
    expect(answer?.content).toBe("Hi");
    expect(answer?.stats).toEqual(stats);
    expect(chat(state, "B")?.messages).toEqual([]);
  });
});
