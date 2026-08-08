import { expect, test } from "@playwright/test";

import { notFound, profile } from "../src/lib/data";

const MISSING_PATH = "/this-page-does-not-exist";

test.describe("not found", () => {
  test("serves a 404 status for unknown routes", async ({ page }) => {
    const response = await page.goto(MISSING_PATH);
    expect(response?.status()).toBe(404);
    await expect(page).toHaveTitle(/Himel/);
  });

  test("announces status and label in the heading", async ({ page }) => {
    await page.goto(MISSING_PATH);

    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toContainText(notFound.status);
    await expect(heading).toContainText(notFound.label);
  });

  test("draws fuzzy canvases for the status and the message", async ({
    page,
  }) => {
    await page.goto(MISSING_PATH);

    const canvases = page.locator("[data-fuzzy-text]");
    await expect(canvases).toHaveCount(2);

    const status = canvases.nth(0);
    await expect
      .poll(() =>
        status.evaluate((element) => element.getBoundingClientRect().width)
      )
      .toBeGreaterThan(100);
    await expect
      .poll(() =>
        status.evaluate((element) => element.getBoundingClientRect().height)
      )
      .toBeGreaterThan(40);

    const message = canvases.nth(1);
    await expect
      .poll(() =>
        message.evaluate((element) => element.getBoundingClientRect().width)
      )
      .toBeGreaterThan(100);
    await expect
      .poll(() =>
        message.evaluate((element) => element.getBoundingClientRect().height)
      )
      .toBeGreaterThan(8);
  });

  test("shows the message and the attempted path", async ({ page }) => {
    await page.goto(MISSING_PATH);

    await expect(page.getByText(notFound.message)).toBeVisible();
    await expect(page.getByText(MISSING_PATH)).toBeVisible();
  });

  test("links home and email from the action list", async ({ page }) => {
    await page.goto(MISSING_PATH);

    for (const action of notFound.actions) {
      await expect(page.getByRole("link", { name: action.label })).toHaveAttribute(
        "href",
        action.href
      );
    }
    await expect(
      page.getByRole("link", { name: notFound.actions[1].label })
    ).toHaveAttribute("href", `mailto:${profile.email}`);
  });

  test("shows all content immediately with reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(MISSING_PATH);

    await expect(page.locator("[data-fuzzy-text]").first()).toBeVisible();
    await expect(page.getByText(notFound.message)).toBeVisible();
    for (const action of notFound.actions) {
      await expect(page.getByRole("link", { name: action.label })).toBeVisible();
    }
  });

  test("stays within the viewport on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(MISSING_PATH);

    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth
    );
    expect(hasOverflow).toBe(false);
  });
});
