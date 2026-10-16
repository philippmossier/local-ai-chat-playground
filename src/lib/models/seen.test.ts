import { describe, expect, it } from "vitest";
import { unseenModels } from "./seen";

describe("unseenModels", () => {
  it("returns only models added since the stored list", () => {
    expect(unseenModels(["a"], ["a", "b", "c"])).toEqual(["b", "c"]);
    expect(unseenModels(["a", "b"], ["a", "b"])).toEqual([]);
  });

  it("announces nothing on a first visit, when no list was ever stored", () => {
    expect(unseenModels(null, ["a", "b"])).toEqual([]);
  });

  it("treats a stored empty list as a real list, reporting every model as unseen", () => {
    expect(unseenModels([], ["a", "b"])).toEqual(["a", "b"]);
  });
});
