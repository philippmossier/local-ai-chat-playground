import { describe, expect, it } from "vitest";
import { unseenModels } from "./seen";

describe("unseenModels", () => {
  it("returns only models added since the stored list", () => {
    expect(unseenModels(["a"], ["a", "b", "c"])).toEqual(["b", "c"]);
    expect(unseenModels(["a", "b"], ["a", "b"])).toEqual([]);
  });
});
