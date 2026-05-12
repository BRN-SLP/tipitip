import { expect, test } from "@playwright/test";

test.describe("smoke", () => {
  test("home page renders the hero", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", {
        name: /reward writers for the lines that move you/i,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /start writing/i }),
    ).toBeVisible();
  });

  test("write page loads", async ({ page }) => {
    await page.goto("/write");
    await expect(
      page.getByRole("heading", { name: /write an article/i }),
    ).toBeVisible();
  });

  test("dashboard prompts for wallet when disconnected", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(
      page.getByText(/connect your wallet to see earnings/i),
    ).toBeVisible();
  });

  test("invalid article id returns 404", async ({ page }) => {
    const response = await page.goto("/a/not-a-hex");
    expect(response?.status()).toBe(404);
  });
});
