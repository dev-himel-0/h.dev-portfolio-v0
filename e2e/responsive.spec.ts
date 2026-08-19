import { expect, test } from "@playwright/test";

const viewports = [
  { name: "tiny phone", width: 280, height: 640 },
  { name: "small phone", width: 320, height: 568 },
  { name: "phone", width: 390, height: 844 },
  { name: "landscape phone", width: 844, height: 390 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "work stack seam", width: 810, height: 768 },
  { name: "large tablet", width: 900, height: 768 },
  { name: "pre-desktop", width: 1023, height: 768 },
  { name: "small desktop", width: 1024, height: 768 },
  { name: "wide desktop", width: 1280, height: 800 },
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

  test("keeps narrow contact actions inside the viewport", async ({ page }) => {
    await page.setViewportSize({ width: 280, height: 640 });
    await page.goto("/");

    const items = await page
      .locator("[data-contact-actions] a")
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

  test("keeps enlarged service icons fully inside their rows", async ({
    page,
  }) => {
    for (const viewport of [
      { width: 280, height: 640 },
      { width: 1440, height: 900 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto("/");

      const rows = await page
        .locator("#services [data-service-row]")
        .evaluateAll((elements) =>
          elements.map((element) => {
            const trail = element.closest("[data-service-row-trail]");
            const icon = element.querySelector("[data-service-icon]");
            if (!trail || !icon) return false;

            const trailRect = trail.getBoundingClientRect();
            const iconRect = icon.getBoundingClientRect();
            return (
              iconRect.left >= trailRect.left - 0.5 &&
              iconRect.right <= trailRect.right - 1 &&
              iconRect.top >= trailRect.top - 0.5 &&
              iconRect.bottom <= trailRect.bottom + 0.5
            );
          }),
        );

      expect(rows.every(Boolean)).toBe(true);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
    }
  });

  test("keeps mobile interactive links at a comfortable hit size", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    const heights = await page
      .locator("#about a[aria-label], #contact [data-contact-actions] a")
      .evaluateAll((elements) =>
        elements.map((element) => element.getBoundingClientRect().height),
      );

    expect(heights.length).toBeGreaterThan(0);
    expect(heights.every((height) => height >= 44)).toBe(true);
  });

  test("keeps stack titles on one line inside narrow bento cells", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 280, height: 640 });
    await page.goto("/");

    const result = await page
      .locator("#stack [data-stack-title]")
      .evaluateAll((elements) =>
        elements.map((element) => {
          const rect = element.getBoundingClientRect();
          const style = getComputedStyle(element);
          return {
            fitsViewport: rect.left >= 0 && rect.right <= window.innerWidth,
            fitsContent: element.scrollWidth <= element.clientWidth + 1,
            lineCount: Math.round(rect.height / parseFloat(style.lineHeight)),
          };
        }),
      );

    expect(
      result.every(
        ({ fitsViewport, fitsContent, lineCount }) =>
          fitsViewport && fitsContent && lineCount === 1,
      ),
    ).toBe(true);
  });

  test("keeps process titles inside the mobile content column", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 280, height: 640 });
    await page.goto("/");

    const result = await page
      .locator("#how-i-work [data-process-copy]")
      .evaluateAll((elements) =>
        elements
          .filter((element) => element.matches(":has(h3)"))
          .map((element) => {
            const title = element.querySelector("h3");
            if (!title) return false;
            const rect = title.getBoundingClientRect();
            return (
              rect.left >= 0 &&
              rect.right <= window.innerWidth &&
              title.scrollWidth <= title.clientWidth + 1
            );
          }),
      );

    expect(result.every(Boolean)).toBe(true);
  });

  test("keeps the sticky work layout contained through the tablet seam", async ({
    page,
  }) => {
    for (const width of [810, 900, 1023]) {
      await page.setViewportSize({ width, height: 768 });
      await page.goto("/");

      const result = await page
        .locator("#work [data-work-row]")
        .first()
        .evaluate((element) => {
          const rect = element.getBoundingClientRect();
          return {
            position: getComputedStyle(element).position,
            fitsViewport: rect.left >= 0 && rect.right <= window.innerWidth,
            fitsContent: element.scrollWidth <= element.clientWidth + 1,
          };
        });

      expect(result.position).toBe("sticky");
      expect(result.fitsViewport).toBe(true);
      expect(result.fitsContent).toBe(true);
    }
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
