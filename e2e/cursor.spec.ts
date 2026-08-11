import { expect, test } from "@playwright/test";
import { profile } from "../src/lib/data";

test.describe("circle cursor", () => {
  test("follows the pointer and expands over interactive elements", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name === "Mobile Chrome",
      "The custom cursor is desktop-only."
    );

    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/");
    await expect(page.locator("[data-curtain-content]")).toBeHidden({
      timeout: 15_000,
    });

    const cursor = page.locator("[data-circle-cursor]");
    const ring = page.locator("[data-circle-cursor-ring]");
    const dot = page.locator("[data-circle-cursor-dot]");
    const focusHalo = page.locator("[data-circle-cursor-focus]");
    const pointer = page.locator("[data-circle-cursor-pointer]");
    const spark = page.locator("[data-circle-cursor-spark]");
    await expect(cursor).toHaveAttribute("data-enabled", "true");
    await expect(cursor).toHaveCSS("z-index", "9999");
    await expect(cursor).toHaveCSS("pointer-events", "none");
    await expect(cursor).toHaveCSS("mix-blend-mode", "difference");
    await expect(page.locator("[data-circle-cursor-orbit]")).toHaveCount(0);
    await expect(spark).toHaveAttribute("data-active", "false");
    await expect(ring).toHaveCSS("width", "40px");
    await expect(ring).toHaveCSS("height", "40px");
    await expect(dot).toHaveCSS("width", "8px");
    await expect(dot).toHaveCSS("height", "8px");
    await expect(pointer).toHaveCSS("width", "36px");
    await expect(pointer).toHaveCSS("height", "36px");
    await expect(pointer).toHaveCSS("background-image", /pointer\.png/);
    await expect(pointer).toHaveCSS("filter", "brightness(0) invert(1)");
    await expect(pointer).toHaveCSS("opacity", "0");
    await expect(focusHalo).toHaveCSS("width", "76px");
    await expect(focusHalo).toHaveCSS("height", "76px");

    await page.mouse.move(320, 280);
    await expect
      .poll(() => ring.evaluate((element) => Number(getComputedStyle(element).opacity)))
      .toBeGreaterThan(0.5);

    await expect
      .poll(() =>
        ring.evaluate((element) => {
          const rect = element.getBoundingClientRect();
          return Math.hypot(rect.left + rect.width / 2 - 320, rect.top + rect.height / 2 - 280);
        })
      )
      .toBeLessThan(3);

    await expect
      .poll(() => dot.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        return Math.hypot(rect.left + rect.width / 2 - 320, rect.top + rect.height / 2 - 280);
      }))
      .toBeLessThan(3);

    const bodyCursor = await page.evaluate(() => getComputedStyle(document.body).cursor);
    expect(bodyCursor).toBe("none");

    await page.getByRole("link", { name: `${profile.name}, home` }).hover();
    await expect(cursor).toHaveAttribute("data-hovered", "true");
    await expect
      .poll(() => ring.evaluate((element) => element.getBoundingClientRect().width))
      .toBeGreaterThan(70);
    await expect(ring).toHaveCSS("background-color", "rgba(255, 255, 255, 0)");
    await expect
      .poll(() => pointer.evaluate((element) => Number(getComputedStyle(element).opacity)))
      .toBeGreaterThan(0.5);
    await expect(ring).toHaveCSS("border-width", "1px");
    await expect
      .poll(async () =>
        Number(await dot.evaluate((element) => getComputedStyle(element).opacity))
      )
      .toBeLessThan(0.05);
    await page.getByRole("button", { name: "Open menu" }).focus();
    await expect(cursor).toHaveAttribute("data-focused", "true");
    await expect(cursor).toHaveAttribute("data-hovered", "true");
    await expect
      .poll(() => focusHalo.evaluate((element) => Number(getComputedStyle(element).opacity)))
      .toBeGreaterThan(0.5);
    await expect
      .poll(() => ring.evaluate((element) => element.getBoundingClientRect().width))
      .toBeGreaterThan(70);
    await expect
      .poll(() => pointer.evaluate((element) => Number(getComputedStyle(element).opacity)))
      .toBeGreaterThan(0.5);

    const focusedButton = page.getByRole("button", { name: "Open menu" });
    await expect
      .poll(async () => {
        const button = await focusedButton.boundingBox();
        const cursorRect = await ring.boundingBox();
        if (!button || !cursorRect) return Number.POSITIVE_INFINITY;
        return Math.hypot(
          cursorRect.x + cursorRect.width / 2 - (button.x + button.width / 2),
          cursorRect.y + cursorRect.height / 2 - (button.y + button.height / 2)
        );
      })
      .toBeLessThan(3);

    await focusedButton.blur();
    await expect(cursor).toHaveAttribute("data-focused", "false");
    await expect
      .poll(() => focusHalo.evaluate((element) => Number(getComputedStyle(element).opacity)))
      .toBeLessThan(0.05);
    await page.mouse.move(700, 300);
    await expect(cursor).toHaveAttribute("data-hovered", "false");
    await expect
      .poll(() => ring.evaluate((element) => element.getBoundingClientRect().width))
      .toBeLessThan(45);
    await expect
      .poll(() => pointer.evaluate((element) => Number(getComputedStyle(element).opacity)))
      .toBeLessThan(0.05);
    await page.mouse.click(700, 300);
    await expect(spark).toHaveAttribute("data-active", "true");
    await expect(spark).toHaveAttribute("data-active", "false", {
      timeout: 2_000,
    });
  });

  test("forces the custom cursor when reduced motion is requested", async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name === "Mobile Chrome",
      "The custom cursor is desktop-only."
    );

    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");

    await expect(page.locator("[data-circle-cursor]")).toHaveAttribute(
      "data-enabled",
      "true"
    );
    await expect(page.locator("html")).toHaveAttribute("data-circle-cursor-active");
    await expect
      .poll(() => page.evaluate(() => getComputedStyle(document.body).cursor))
      .toBe("none");
  });

  test("only enables the cursor for fine pointers", async ({ page }) => {
    await page.goto("/");

    const finePointer = await page.evaluate(() =>
      window.matchMedia("(hover: hover) and (pointer: fine)").matches
    );

    await expect(page.locator("[data-circle-cursor]")).toHaveAttribute(
      "data-enabled",
      String(finePointer)
    );
    if (finePointer) {
      await expect(page.locator("html")).toHaveAttribute("data-circle-cursor-active");
    } else {
      await expect(page.locator("html")).not.toHaveAttribute("data-circle-cursor-active");
    }
  });
});
