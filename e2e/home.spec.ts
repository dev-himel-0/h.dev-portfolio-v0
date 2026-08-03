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

test.describe("home (responsive)", () => {
  const fitInViewport = (box: { x: number; width: number }, width: number) => {
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(width);
  };

  test("hero title and actions fit within 320px and 375px viewports", async ({
    page,
  }) => {
    for (const width of [320, 375]) {
      await page.setViewportSize({ width, height: 667 });
      await page.goto("/");

      const heading = page.locator("#hero-heading");
      await expect(heading).toBeVisible();
      const headingBox = await heading.boundingBox();
      expect(headingBox).not.toBeNull();
      fitInViewport(headingBox!, width);

      const actions = page.locator("[data-hero-action]");
      for (const action of await actions.all()) {
        const box = await action.boundingBox();
        expect(box).not.toBeNull();
        fitInViewport(box!, width);
      }

      expect(
        await page.evaluate(() => document.documentElement.scrollWidth)
      ).toBeLessThanOrEqual(width);
    }
  });

  test("preloader words fit within a 320px viewport", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const content = page.locator("[data-curtain-content]");
    await expect(content).toBeVisible();
    const box = await content.boundingBox();
    expect(box).not.toBeNull();
    fitInViewport(box!, 320);
  });

  test("menu fits without horizontal overflow on small and landscape screens", async ({
    page,
  }) => {
    const cases = [
      { width: 320, height: 568, label: "small portrait" },
      { width: 667, height: 375, label: "landscape" },
    ];

    for (const { width, height, label } of cases) {
      await page.setViewportSize({ width, height });
      await page.goto("/");

      const toggle = page.locator("[data-hero-menu-toggle]");
      await toggle.click();

      const panel = page.locator("#staggered-menu-panel");
      await expect(panel).toBeVisible();
      await expect
        .poll(() => panel.evaluate((el) => el.scrollWidth - el.clientWidth), {
          message: `panel must not scroll horizontally (${label})`,
        })
        .toBeLessThanOrEqual(1);

      const panelBox = await panel.boundingBox();
      expect(panelBox).not.toBeNull();

      for (const item of navigation) {
        const link = panel.getByRole("link", { name: item.label });
        await expect(link).toBeVisible();
        const box = await link.boundingBox();
        expect(box, `${item.label} (${label})`).not.toBeNull();
        fitInViewport(box!, width);
      }

      const email = panel.getByRole("link", { name: profile.email });
      await expect(email).toBeVisible();
      const emailBox = await email.boundingBox();
      expect(emailBox).not.toBeNull();
      expect(emailBox!.x).toBeGreaterThanOrEqual(panelBox!.x - 1);
      expect(emailBox!.x + emailBox!.width).toBeLessThanOrEqual(
        panelBox!.x + panelBox!.width + 1
      );
    }
  });
});
