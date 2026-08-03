import { expect, test } from "@playwright/test";

import { hero, navigation, profile } from "../src/lib/data";

test.describe("home", () => {
  test("loads with a 200 response", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(/Himel/);
  });

  test("renders the hero heading and actions", async ({ page }) => {
    await page.goto("/");

    const heading = page.locator("#hero-heading");
    await expect(heading).toBeVisible();
    await expect(heading).toContainText(hero.filledTitle);
    await expect(heading).toContainText(hero.outlinedTitle);

    for (const action of hero.actions) {
      await expect(
        page.getByRole("link", { name: action.label })
      ).toBeVisible();
    }
  });

  test("renders the navbar with navigation links", async ({ page }) => {
    await page.goto("/");

    const nav = page.getByRole("navigation", { name: "Primary navigation" });
    await expect(nav).toBeVisible();

    for (const item of navigation) {
      await expect(
        nav.getByRole("link", { name: item.label })
      ).toHaveAttribute("href", item.href);
    }

    await expect(
      page.getByRole("link", { name: `${profile.name}, home` })
    ).toBeVisible();
  });
});
