import { describe, expect, it } from "vitest";
import { reasonText } from "./labels";

describe("reasonText", () => {
  it("explains low memory without talking about phones and tablets", () => {
    const lowMemory = reasonText("hw.lowMemory", 0);
    expect(lowMemory).not.toBe(reasonText("hw.mobile", 0));
    expect(lowMemory).not.toMatch(/phone|tablet|handy/i);
  });
});
