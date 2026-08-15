import { expect, test } from "@playwright/test";

const viewports = [
  { name: "tiny phone", width: 280, height: 640 },
  { name: "small phone", width: 320, height: 568 },
  { name: "phone", width: 390, height: 844 },
  { name: "landscape phone", width: 844, height: 390 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "small desktop", width: 1024, height: 768 },
  { name: "desktop", width: 1440, height: 900 },
];

test.describe("responsive layout", () => {
  for (const viewport of viewports) {
    test(`stays inside the viewport at ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto("/");
      await expect(page.locator("[data-curtain-content]")).toBeHidden({
        timeout: 15_000,
      });

      const layout = await page.evaluate(() => {
        const visibleOutliers = [...document.querySelectorAll("body *")]
          .filter((element) => {
            if (element.closest(".smg")) return false;
            if (element.closest("[data-circle-cursor]")) return false;
            if (element.closest("[data-stack-icon]")) return false;
            if (element.closest("[data-image-trail-item]")) return false;
            if (element.closest("[data-image-reveal]")) return false;
            const style = getComputedStyle(element);
            return style.display !== "none" && style.visibility !== "hidden";
          })
          .map((element) => {
            const rect = element.getBoundingClientRect();
            return { left: rect.left, right: rect.right, width: rect.width };
          })
          .filter(
            ({ left, right, width }) =>
              width > 0 && (left < -1 || right > window.innerWidth + 1),
          );

        return {
          scrollWidth: document.documentElement.scrollWidth,
          innerWidth: window.innerWidth,
          visibleOutliers,
        };
      });

      expect(layout.scrollWidth).toBeLessThanOrEqual(layout.innerWidth);
      expect(layout.visibleOutliers).toEqual([]);
    });
  }

  test("wraps narrow footer socials without clipping", async ({ page }) => {
    await page.setViewportSize({ width: 280, height: 640 });
    await page.goto("/");

    const items = await page
      .locator("[data-footer-socials] > li")
      .evaluateAll((elements) =>
        elements.map((element) => {
          const rect = element.getBoundingClientRect();
          return { left: rect.left, right: rect.right };
        }),
      );
    const viewportWidth = await page.evaluate(() => window.innerWidth);

    expect(
      items.every(({ left, right }) => left >= 0 && right <= viewportWidth),
    ).toBe(true);
  });

  test("keeps service titles clear of their icons at the smallest width", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 280, height: 640 });
    await page.goto("/");

    const rows = await page
      .locator("[data-service-row]")
      .evaluateAll((elements) =>
        elements.map((element) => {
          const title = element.querySelector("[data-service-title]");
          const icon = element.querySelector("[data-service-icon]");
          if (!title || !icon) return false;

          const titleRect = title.getBoundingClientRect();
          const iconRect = icon.getBoundingClientRect();
          return (
            title.scrollWidth <= title.clientWidth &&
            titleRect.right <= iconRect.left
          );
        }),
      );

    expect(rows.every(Boolean)).toBe(true);
  });

  for (const viewport of [
    { name: "landscape phone", width: 844, height: 390 },
    { name: "short desktop", width: 1440, height: 900 },
  ]) {
    test(`fits the open menu at ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto("/");
      await page.locator("[data-hero-menu-toggle]").click();

      const menu = await page
        .locator("#staggered-menu-panel")
        .evaluate((element) => ({
          scrollHeight: element.scrollHeight,
          clientHeight: element.clientHeight,
        }));

      expect(menu.scrollHeight).toBeLessThanOrEqual(menu.clientHeight + 1);
    });
  }
});
