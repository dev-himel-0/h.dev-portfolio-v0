import { expect, test } from "@playwright/test";

import { hero, navigation, profile } from "../src/lib/data";

test.describe("home", () => {
  test("loads with a 200 response", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(/Himel/);
  });

  test("shows the preloader progress line before revealing the page", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const progress = page.locator("[data-curtain-progress-fill]");
    await expect(progress).toHaveCount(1);
    await expect(progress).toBeVisible();
    await expect(progress).toHaveClass(/scale-x-0/);

    await expect(page.locator("[data-curtain-content]")).toBeHidden({
      timeout: 10_000,
    });
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

  test("shows all hero content immediately with reduced motion", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
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
});
