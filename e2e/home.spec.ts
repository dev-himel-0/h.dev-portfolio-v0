import { expect, test } from "@playwright/test";

import { hero, navigation, profile, socials } from "../src/lib/data";

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

  test("renders the navbar with the menu toggle and monogram", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(
      page.getByRole("link", { name: `${profile.name}, home` })
    ).toBeVisible();

    const toggle = page.locator("[data-hero-menu-toggle]");
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(toggle).toHaveAttribute("aria-controls", "staggered-menu-panel");

    await expect(page.locator("#staggered-menu-panel")).toBeHidden();
  });

  test("opens the staggered menu with navigation, email and availability", async ({
    page,
  }) => {
    await page.goto("/");

    const toggle = page.locator("[data-hero-menu-toggle]");
    await toggle.click();

    await expect(page.getByRole("button", { name: "Close menu" })).toBeVisible();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");

    const panel = page.locator("#staggered-menu-panel");
    await expect(panel).toBeVisible();

    for (const item of navigation) {
      await expect(
        panel.getByRole("link", { name: item.label })
      ).toHaveAttribute("href", item.href);
    }

    await expect(
      panel.getByRole("link", { name: profile.email })
    ).toHaveAttribute("href", `mailto:${profile.email}`);
    await expect(panel.getByText(profile.availability)).toBeVisible();

    for (const social of socials) {
      if (social.href) {
        await expect(
          panel.getByRole("link", { name: social.label })
        ).toBeVisible();
      } else {
        await expect(panel.getByText(social.label)).toBeVisible();
      }
    }
  });

  test("closes the staggered menu on toggle, escape and click-away", async ({
    page,
  }) => {
    await page.goto("/");

    const toggle = page.locator("[data-hero-menu-toggle]");
    const panel = page.locator("#staggered-menu-panel");

    await toggle.click();
    await expect(panel).toBeVisible();
    await page.getByRole("button", { name: "Close menu" }).click();
    await expect(panel).toBeHidden();
    await expect(page.getByRole("button", { name: "Open menu" })).toBeVisible();

    await toggle.click();
    await expect(panel).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(panel).toBeHidden();

    await toggle.click();
    await expect(panel).toBeVisible();
    await page.getByRole("link", { name: `${profile.name}, home` }).click();
    await expect(panel).toBeHidden();
  });

  test("menu panel covers the full viewport", async ({ page }) => {
    await page.goto("/");

    await page.locator("[data-hero-menu-toggle]").click();
    const panel = page.locator("#staggered-menu-panel");
    await expect(panel).toBeVisible();

    const box = await panel.boundingBox();
    const viewport = page.viewportSize();
    expect(box?.width ?? 0).toBeGreaterThanOrEqual(viewport.width - 1);
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(viewport.height - 1);
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
