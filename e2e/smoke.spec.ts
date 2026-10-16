import { expect, test } from "@playwright/test";

test("start a model and get an answer from the fake engine", async ({
  page,
  context,
}) => {
  // The fake engine downloads nothing: every request stays on the dev server.
  const hosts = new Set<string>();
  context.on("request", (r) => hosts.add(new URL(r.url()).host));

  await page.goto("/");
  await page.getByRole("button", { name: /start/i }).first().click();

  const box = page.getByRole("textbox", { name: "Message" });
  await expect(box).toBeEditable();
  await box.fill("hello there");
  await box.press("Enter");

  await expect(page.getByText("Fake answer to: hello there")).toBeVisible();
  await expect(page.getByRole("button", { name: "Send" })).toBeVisible();
  expect([...hosts]).toEqual(["localhost:5199"]);
});
