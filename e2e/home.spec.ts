import { expect, test } from "@playwright/test";

import {
  about,
  contact as contactContent,
  hero,
  navigation,
  profile,
  processSection,
  processSteps,
  projects,
  services,
  serviceIconSources,
  servicesSection,
  socials,
  stackCapabilities,
  stackSection,
  stats,
  work,
} from "../src/lib/data";

const stripY = (strip: import("@playwright/test").Locator) =>
  strip.evaluate((el) => {
    const element = el as HTMLElement;
    const matrix = getComputedStyle(element).transform;
    if (!matrix || matrix === "none") return 0;
    return new DOMMatrixReadOnly(matrix).m42;
  });

const stripTarget = (strip: import("@playwright/test").Locator) =>
  strip.evaluate((el) => {
    const element = el as HTMLElement;
    return -(Number(element.dataset.digit) * element.offsetHeight) / 10;
  });

const visibleDigit = (strip: import("@playwright/test").Locator) =>
  strip.evaluate((el) => {
    const element = el as HTMLElement;
    const containerTop = element.parentElement!.getBoundingClientRect().top;
    const children = Array.from(element.children);
    return children.findIndex(
      (child) => Math.abs(child.getBoundingClientRect().top - containerTop) < 2,
    );
  });

const translateY = (element: import("@playwright/test").Locator) =>
  element.evaluate((node) => {
    const transform = getComputedStyle(node).transform;
    if (transform === "none") return 0;
    return new DOMMatrixReadOnly(transform).m42;
  });

const opacityOf = (element: import("@playwright/test").Locator) =>
  element.evaluate((node) => Number.parseFloat(getComputedStyle(node).opacity));

test.describe("home", () => {
  test("loads with a 200 response", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(/Himel/);
  });

  test("uses the custom favicon", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator('link[rel="icon"]')).toHaveAttribute(
      "href",
      /\/img\/h\.png/,
    );
  });

  test("renders the preloader progress line before revealing the page", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/", { waitUntil: "commit" });

    const progress = page.locator("[data-curtain-progress-fill]");
    await expect(progress).toHaveCount(1);
    await expect(progress).toHaveClass(/scale-x-0/);

    if (await progress.isVisible()) {
      await expect(page.locator("[data-curtain-content]")).toBeHidden({
        timeout: 10_000,
      });
    }
  });

  test("shows the odometer counter during the preloader", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const odometer = page.locator("[data-curtain-content] [data-odometer]");
    await expect(odometer).toBeVisible();
    await expect(odometer.locator("[data-odometer-wheel]")).toHaveCount(3);

    await expect(odometer).toBeHidden({ timeout: 15_000 });
  });

  test("restores scrolling after the preloader finishes", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("[data-curtain-content]")).toBeHidden({
      timeout: 15_000,
    });
    await expect
      .poll(() =>
        page.evaluate(() =>
          document.documentElement.classList.contains("lenis-stopped"),
        ),
      )
      .toBe(false);

    const before = await page.evaluate(() => window.scrollY);
    await page.mouse.wheel(0, 600);
    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBeGreaterThan(before);
  });

  test("matches Satz's Lenis scroll interpolation", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name === "Mobile Chrome",
      "Wheel interpolation is desktop-only; touch scrolling remains native.",
    );
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/");
    await expect(page.locator("[data-curtain-content]")).toBeHidden({
      timeout: 15_000,
    });
    await expect
      .poll(() =>
        page.evaluate(() =>
          document.documentElement.classList.contains("lenis-stopped"),
        ),
      )
      .toBe(false);

    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(100);
    const inMotion = await page.evaluate(() => window.scrollY);
    const isSmooth = await page.evaluate(() =>
      document.documentElement.classList.contains("lenis-smooth"),
    );

    await expect
      .poll(() => page.evaluate(() => window.scrollY), { timeout: 3_000 })
      .toBeGreaterThan(590);
    const settled = await page.evaluate(() => window.scrollY);

    expect(inMotion).toBeGreaterThan(50);
    expect(inMotion).toBeLessThan(500);
    expect(settled).toBeGreaterThan(590);
    expect(isSmooth).toBe(true);
  });

  test("renders the hero heading and actions", async ({ page }) => {
    await page.goto("/");

    const heading = page.locator("#hero-heading");
    await expect(heading).toBeVisible();
    await expect(heading).toContainText(hero.filledTitle);
    await expect(heading).toContainText(hero.outlinedTitle);

    const heroSection = page.locator("#home");
    for (const action of hero.actions) {
      await expect(
        heroSection.getByRole("link", { name: action.label }),
      ).toBeVisible();
    }
  });

  test("choreographs the hero layers into a cinematic scroll exit", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/");
    await expect(page.locator("[data-curtain-content]")).toBeHidden({
      timeout: 15_000,
    });

    const title = page.locator("[data-hero-title-parallax]");
    const greeting = page.locator("[data-hero-greeting-parallax]");
    const action = page.locator("[data-hero-actions-parallax]");
    const scrollCue = page.locator("[data-hero-scroll]");
    const initial = await translateY(title);
    const initialAction = await translateY(action);
    const initialCueOpacity = await opacityOf(scrollCue);

    if ((page.viewportSize()?.width ?? 0) < 810) {
      await page.evaluate(() =>
        window.scrollTo({ top: Math.round(window.innerHeight * 0.5) }),
      );
      await page.waitForTimeout(100);
      expect(await translateY(title)).toBeCloseTo(initial, 0);
      expect(await translateY(greeting)).toBeCloseTo(0, 0);
      expect(await translateY(action)).toBeCloseTo(initialAction, 0);
      expect(await opacityOf(scrollCue)).toBeCloseTo(initialCueOpacity, 1);
      return;
    }

    await page.evaluate(() =>
      window.scrollTo({
        top: Math.round(window.innerHeight * 0.5),
        behavior: "instant",
      }),
    );
    await expect
      .poll(() => translateY(title), "hero title moves upward during scroll")
      .toBeLessThan(initial - 2);
    await expect
      .poll(
        () => translateY(greeting),
        "hero greeting moves upward at a slower rate",
      )
      .toBeLessThan(-1);
    await expect
      .poll(
        () => translateY(action),
        "hero action moves down against the title",
      )
      .toBeGreaterThan(initialAction + 1);
    await expect
      .poll(() => opacityOf(scrollCue), "scroll cue exits early")
      .toBeLessThan(initialCueOpacity - 0.1);
  });

  test("keeps the hero title static with reduced motion enabled", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");

    const title = page.locator("[data-hero-title-parallax]");
    const initial = await translateY(title);

    await page.evaluate(() =>
      window.scrollTo({
        top: Math.round(window.innerHeight * 0.5),
        behavior: "instant",
      }),
    );
    await page.waitForTimeout(100);

    expect(await translateY(title)).toBeCloseTo(initial, 0);
  });

  test("scroll arrow fades and slides up with page scroll, disappearing at the bottom", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/");
    await expect(page.locator("[data-curtain-content]")).toBeHidden({
      timeout: 15_000,
    });

    const arrow = page.locator("[data-scroll-arrow]");
    const line = page.locator("[data-scroll-line]");
    const chevron = page.locator("[data-scroll-chevron]");
    const container = page.locator("[data-hero-scroll]");
    const arrowHeight = () =>
      arrow.evaluate((element) => element.getBoundingClientRect().height);
    const lineHeight = () =>
      line.evaluate((element) => element.getBoundingClientRect().height);
    const chevronOpacity = () =>
      chevron.evaluate((element) => Number(getComputedStyle(element).opacity));
    const opacity = () =>
      container.evaluate((element) =>
        Number(getComputedStyle(element).opacity),
      );
    const translateY = () =>
      container.evaluate((element) => {
        const matrix =
          getComputedStyle(element).transform.match(/matrix[^)]*\)/);
        if (!matrix) return 0;
        const values = matrix[0].match(/-?[\d.]+/g);
        return values ? Number(values[values.length - 1]) : 0;
      });

    await expect
      .poll(arrowHeight, "arrow draws in after the preloader")
      .toBeGreaterThan(20);
    await expect
      .poll(lineHeight, "arrow line draws in after the preloader")
      .toBeGreaterThan(20);
    await expect
      .poll(chevronOpacity, "arrow chevron reveals after the line")
      .toBeGreaterThan(0.9);
    const initial = await arrowHeight();
    const initialOpacity = await opacity();
    expect(initial).toBeGreaterThan(20);
    expect(initialOpacity).toBeGreaterThan(0.9);

    if ((page.viewportSize()?.width ?? 0) < 810) {
      await page.evaluate(() =>
        window.scrollTo(0, document.documentElement.scrollHeight / 2),
      );
      await page.waitForTimeout(100);
      expect(await opacity()).toBeCloseTo(initialOpacity, 1);
      expect(await translateY()).toBeCloseTo(0, 0);
      return;
    }

    await page.evaluate(() =>
      window.scrollTo(0, document.documentElement.scrollHeight / 2),
    );
    await expect
      .poll(opacity, "arrow fades halfway down the page")
      .toBeLessThan(initialOpacity - 0.1);
    await expect
      .poll(translateY, "arrow slides up halfway down the page")
      .toBeLessThan(-10);
    const halfwayHeight = await arrowHeight();
    expect(halfwayHeight).toBeGreaterThan(initial - 5);

    await page.evaluate(() =>
      window.scrollTo(0, document.documentElement.scrollHeight),
    );
    await expect
      .poll(opacity, "arrow is gone at the bottom of the page")
      .toBeLessThan(0.05);
    await expect
      .poll(translateY, "arrow is slid up at the bottom of the page")
      .toBeLessThan(-40);
  });

  test("renders the navbar with the menu toggle and monogram", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(
      page.getByRole("link", { name: `${profile.name}, home` }),
    ).toBeVisible();

    await expect(
      page.getByRole("link", { name: `${profile.name}, home` }),
    ).toHaveText(profile.brand);

    const toggle = page.locator("[data-hero-menu-toggle]");
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(toggle).toHaveAttribute(
      "aria-controls",
      "staggered-menu-panel",
    );

    const visibleToggleLabel = () =>
      toggle.locator(".smg-toggle-lines").evaluate((el) => {
        const html = el as HTMLElement;
        const lines = Array.from(html.querySelectorAll(".smg-toggle-line"));
        const lineHeight = lines[0]?.getBoundingClientRect().height || 1;
        const match = window.getComputedStyle(html).transform.match(/[-.\d]+/g);
        const translateY = match && match.length >= 6 ? Number(match[5]) : 0;
        const index = Math.min(
          lines.length - 1,
          Math.max(0, Math.round(-translateY / lineHeight)),
        );
        return (lines[index] as HTMLElement)?.textContent ?? "";
      });

    await expect
      .poll(visibleToggleLabel, "toggle reads Menu before any interaction")
      .toBe("Menu");

    await expect(page.locator("#staggered-menu-panel")).toBeHidden();
  });

  test("toggle markup is deterministic on load", async ({ page }) => {
    const hydrationErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error" && /hydration/i.test(msg.text())) {
        hydrationErrors.push(msg.text());
      }
    });

    await page.goto("/");

    const toggle = page.locator("[data-hero-menu-toggle]");
    await expect(toggle).toBeVisible();

    const lineCount = await toggle.locator(".smg-toggle-line").count();
    expect(lineCount).toBeGreaterThan(1);

    await expect
      .poll(
        () =>
          toggle.locator(".smg-toggle-lines").evaluate((el) => {
            const html = el as HTMLElement;
            const lines = Array.from(html.querySelectorAll(".smg-toggle-line"));
            const lineHeight = lines[0]?.getBoundingClientRect().height || 1;
            const match = window
              .getComputedStyle(html)
              .transform.match(/[-.\d]+/g);
            const translateY =
              match && match.length >= 6 ? Number(match[5]) : 0;
            const index = Math.min(
              lines.length - 1,
              Math.max(0, Math.round(-translateY / lineHeight)),
            );
            return lines[index]?.textContent ?? "";
          }),
        "toggle settles on Menu under reduced motion",
      )
      .toBe("Menu");

    await expect
      .poll(
        () => hydrationErrors.length,
        "no hydration mismatch on load under reduced motion",
      )
      .toBe(0);
  });

  test("navbar background is hidden while the hero is on screen", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator("[data-curtain-content]")).toBeHidden({
      timeout: 15_000,
    });

    const bar = page.locator("[data-navbar-bg]");
    await expect(bar).toHaveCount(1);
    const opacity = () =>
      bar.evaluate((element) => Number(getComputedStyle(element).opacity));
    await expect
      .poll(opacity, "no background before the scroll threshold")
      .toBe(0);
    await expect(page.locator("[data-glass-surface]")).toHaveCount(0);

    // The header itself stays transparent — a very small scroll must not fade the bar in.
    await page.evaluate(() => window.scrollTo(0, 20));
    await expect.poll(opacity, "a small scroll keeps the bar hidden").toBe(0);
  });

  test("navbar background fades in after the scroll threshold as sharp full-bleed transparent glass", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator("[data-curtain-content]")).toBeHidden({
      timeout: 15_000,
    });

    await page.evaluate(() => window.scrollTo(0, 400));

    const bar = page.locator("[data-navbar-bg]");
    await expect(bar).toHaveCount(1);
    await expect(bar).toBeVisible();

    const opacity = () =>
      bar.evaluate((element) => Number(getComputedStyle(element).opacity));
    await expect
      .poll(opacity, "background fades to full opacity")
      .toBeCloseTo(1, 1);

    // Desktop keeps the glass treatment. Touch layouts use an opaque surface
    // to avoid repainting the page behind a live backdrop blur.
    const viewport = page.viewportSize();
    const isTouchLayout = (viewport?.width ?? 0) < 810;
    const box = await bar.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeCloseTo(0, 0);
    expect(box!.x + box!.width).toBeCloseTo(viewport!.width, 0);
    const radius = await bar.evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).borderRadius),
    );
    expect(radius).toBeLessThanOrEqual(1);
    expect(
      await bar.evaluate(
        (element) => getComputedStyle(element).borderBottomWidth,
      ),
    ).toBe("0px");
    expect(
      await bar.evaluate(
        (element) => getComputedStyle(element).backgroundColor,
      ),
    ).toBe(isTouchLayout ? "rgba(255, 255, 255, 0.94)" : "rgba(0, 0, 0, 0)");

    const backdropFilter = () =>
      bar.evaluate((element) => getComputedStyle(element).backdropFilter);
    await expect
      .poll(backdropFilter, "bar uses the viewport-appropriate surface")
      .toBe(isTouchLayout ? "none" : "blur(10px)");
    const filterValue = await bar.evaluate(
      (element) => getComputedStyle(element).backdropFilter,
    );
    expect(filterValue, "no SVG displacement filter").not.toContain("url(");

    // Content stays on top and interactive.
    await expect(
      page.getByRole("link", { name: `${profile.name}, home` }),
    ).toBeVisible();
    await expect(page.locator("[data-hero-menu-toggle]")).toBeVisible();
  });

  test("navbar background fades out when scrolling back to the top", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator("[data-curtain-content]")).toBeHidden({
      timeout: 15_000,
    });

    const bar = page.locator("[data-navbar-bg]");
    const opacity = () =>
      bar.evaluate((element) => Number(getComputedStyle(element).opacity));
    await page.evaluate(() => window.scrollTo(0, 300));
    await expect
      .poll(opacity, "bar fades in once the hero leaves view")
      .toBeCloseTo(1, 1);

    await page.evaluate(() => window.scrollTo(0, 0));
    await expect
      .poll(opacity, "bar fades back out as the hero returns to view")
      .toBe(0);
  });

  test("opens the staggered menu with navigation, email and availability", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator("[data-curtain-content]")).toBeHidden({
      timeout: 15_000,
    });

    const toggle = page.locator("[data-hero-menu-toggle]");
    await toggle.click();

    await expect(
      page.getByRole("button", { name: "Close menu" }),
    ).toBeVisible();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");

    const panel = page.locator("#staggered-menu-panel");
    await expect(panel).toBeVisible();

    await expect(
      panel.getByRole("link", { name: navigation[0].label }),
      "first nav link appears quickly after opening the menu",
    ).toBeVisible({ timeout: 1_500 });

    for (const item of navigation) {
      await expect(
        panel.getByRole("link", { name: item.label }),
      ).toHaveAttribute("href", item.href);
    }

    await expect(
      panel.getByRole("link", { name: profile.email }),
    ).toHaveAttribute("href", `mailto:${profile.email}`);
    await expect(panel.getByText(profile.availability)).toBeVisible();

    for (const social of socials) {
      if (social.href) {
        await expect(
          panel.getByRole("link", { name: social.label }),
        ).toBeVisible();
      } else {
        await expect(panel.getByText(social.label)).toBeVisible();
      }
    }
  });

  test("menu navigation skips the shared curtain wipe", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/");
    await expect(page.locator("[data-curtain-content]")).toBeHidden({
      timeout: 15_000,
    });

    const firstItem = navigation[0];
    const curtain = page.locator("[data-wipe-curtain]");
    await page.locator("[data-hero-menu-toggle]").click();

    const menuLink = page
      .locator("#staggered-menu-panel")
      .getByRole("link", { name: firstItem.label });
    await expect(menuLink).toBeVisible({ timeout: 2_000 });
    await menuLink.click();

    await expect(curtain).toBeHidden();
    await expect
      .poll(() => page.evaluate(() => window.location.hash))
      .toBe(firstItem.href);
    await expect(page.locator(firstItem.href)).toBeInViewport();
    await expect(page.locator("#staggered-menu-panel")).toBeHidden({
      timeout: 2_500,
    });
  });

  test("uses a three-fold right-to-left reveal and Yunox-style menu icon", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/");
    await expect(page.locator("[data-curtain-content]")).toBeHidden({
      timeout: 15_000,
    });

    const toggle = page.locator("[data-hero-menu-toggle]");
    const folds = page.locator("[data-menu-prelayer]");
    const firstBar = toggle.locator(".smg-toggle-bar-a");
    const secondBar = toggle.locator(".smg-toggle-bar-b");
    expect(await folds.count()).toBe(3);

    const iconState = (bar: import("@playwright/test").Locator) =>
      bar.evaluate((element) => {
        const matrix = new DOMMatrixReadOnly(
          getComputedStyle(element).transform,
        );
        return {
          x: matrix.e,
          y: matrix.f,
          rotation: Math.round(
            (Math.atan2(matrix.b, matrix.a) * 180) / Math.PI,
          ),
        };
      });

    const closedFirst = await iconState(firstBar);
    const closedSecond = await iconState(secondBar);
    expect(closedFirst.rotation).toBe(0);
    expect(closedSecond.rotation).toBe(0);
    expect(closedFirst.y).toBeLessThan(0);
    expect(closedSecond.y).toBeGreaterThan(0);

    await toggle.click();
    const viewport = page.viewportSize();
    expect(viewport).not.toBeNull();

    await page.waitForTimeout(100);
    const foldOffsets = await folds.evaluateAll((elements) =>
      elements.map(
        (element) =>
          new DOMMatrixReadOnly(getComputedStyle(element).transform).e,
      ),
    );
    expect(foldOffsets[0]).toBeLessThan(foldOffsets[1]);
    expect(foldOffsets[1]).toBeLessThanOrEqual(foldOffsets[2]);
    expect(foldOffsets[0]).toBeLessThan((viewport?.width ?? 0) * 0.9);

    await expect
      .poll(() => iconState(firstBar).then((state) => state.rotation))
      .toBe(45);
    await expect
      .poll(() => iconState(secondBar).then((state) => state.rotation))
      .toBe(-45);

    await expect
      .poll(
        () =>
          folds.evaluateAll((elements) =>
            elements.map(
              (element) =>
                new DOMMatrixReadOnly(getComputedStyle(element).transform).e,
            ),
          ),
        { timeout: 2_500 },
      )
      .toEqual([0, 0, 0]);

    await toggle.click();
    await expect(page.locator("#staggered-menu-panel")).toBeHidden({
      timeout: 2_500,
    });
    await expect
      .poll(() => iconState(firstBar).then((state) => state.rotation))
      .toBe(0);
    await expect
      .poll(() => iconState(secondBar).then((state) => state.rotation))
      .toBe(0);
  });

  test("reverse-staggers the three folds while closing", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/");
    await expect(page.locator("[data-curtain-content]")).toBeHidden({
      timeout: 15_000,
    });

    const toggle = page.locator("[data-hero-menu-toggle]");
    const folds = page.locator("[data-menu-prelayer]");
    const panel = page.locator("#staggered-menu-panel");

    await toggle.click();
    await expect(panel).toBeVisible();
    await expect
      .poll(
        () =>
          folds.evaluateAll((elements) =>
            elements.every(
              (element) =>
                new DOMMatrixReadOnly(getComputedStyle(element).transform).e ===
                0,
            ),
          ),
        { timeout: 2_500 },
      )
      .toBe(true);

    await toggle.click();
    await expect
      .poll(
        () =>
          folds.evaluateAll((elements) => {
            const offsets = elements.map(
              (element) =>
                new DOMMatrixReadOnly(getComputedStyle(element).transform).e,
            );
            return offsets[0] < offsets[1] && offsets[1] < offsets[2];
          }),
        { timeout: 500 },
      )
      .toBe(true);

    await expect(panel).toBeHidden({ timeout: 2_500 });
  });

  test("menu links are split into masked character pairs", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("[data-curtain-content]")).toBeHidden({
      timeout: 15_000,
    });
    await page.locator("[data-hero-menu-toggle]").click();
    const panel = page.locator("#staggered-menu-panel");
    await expect(panel).toBeVisible();

    await expect(panel.locator("[data-menu-item]")).toHaveCount(
      navigation.length,
    );

    for (const item of navigation) {
      const link = panel.getByRole("link", { name: item.label });
      const masks = link.locator(".smg-char-mask");
      await expect(
        masks,
        `${item.label} is split into ${item.label.length} character masks`,
      ).toHaveCount(item.label.length);

      const rest = await masks.locator(".smg-char-a").allTextContents();
      const clone = await masks.locator(".smg-char-b").allTextContents();
      expect(
        rest.join("").replace(/\u00a0/g, " "),
        "resting copy spells the label",
      ).toBe(item.label);
      expect(
        clone.join("").replace(/\u00a0/g, " "),
        "duplicate copy spells the label",
      ).toBe(item.label);
      await expect(masks.locator(".smg-char-b").first()).toHaveAttribute(
        "aria-hidden",
        "true",
      );
    }
  });

  test("menu label characters roll up in a wave on hover", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/");

    // The toggle sits under the curtain while the preloader plays; wait for
    // the reveal to finish so the menu opens cleanly.
    await expect(page.locator("[data-curtain-content]")).toBeHidden({
      timeout: 15_000,
    });

    await page.locator("[data-hero-menu-toggle]").click();
    const panel = page.locator("#staggered-menu-panel");
    await expect(panel).toBeVisible();

    const link = panel.getByRole("link", { name: navigation[0].label });
    await expect(link).toBeVisible({ timeout: 2_000 });

    // Wait for the entrance cascade to settle (GSAP clears the masks' inline
    // transform on completion) so the link no longer moves under the cursor.
    await expect
      .poll(() =>
        link
          .locator("[data-menu-item-label]")
          .evaluate((el) => getComputedStyle(el).transform),
      )
      .toBe("none");

    const rest = link.locator(".smg-char-a").first();
    const clone = link.locator(".smg-char-b").first();

    const restTransform = () =>
      rest.evaluate((el) => getComputedStyle(el).transform);

    await expect
      .poll(restTransform, "resting copy sits flat before hover")
      .toBe("matrix(1, 0, 0, 1, 0, 0)");

    await link.hover();

    await expect
      .poll(restTransform, "resting copy rolls up out of the mask")
      .not.toBe("matrix(1, 0, 0, 1, 0, 0)");

    await expect
      .poll(
        () => clone.evaluate((el) => getComputedStyle(el).transform),
        "duplicate rolls in to fill the mask",
      )
      .toBe("matrix(1, 0, 0, 1, 0, 0)");
  });

  test("menu numbers sit beside the labels and rise into view on open", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator("[data-curtain-content]")).toBeHidden({
      timeout: 15_000,
    });
    await page.locator("[data-hero-menu-toggle]").click();
    const panel = page.locator("#staggered-menu-panel");
    await expect(panel).toBeVisible();

    const link = panel.getByRole("link", { name: navigation[0].label });
    await expect(link).toBeVisible({ timeout: 2_000 });

    const numberRise = () =>
      link.evaluate((el) =>
        getComputedStyle(el).getPropertyValue("--sm-num-rise").trim(),
      );

    await expect
      .poll(numberRise, "number rise settles flush on open")
      .toBe("0%");

    const numberStyle = await link.evaluate((el) => {
      const style = getComputedStyle(el, "::before");
      return {
        left: parseFloat(style.left),
        anchorWidth: el.getBoundingClientRect().width,
        opacity: style.opacity,
        fontSize: parseFloat(style.fontSize),
      };
    });
    expect(
      Math.abs(numberStyle.left - numberStyle.anchorWidth),
      "number anchors to the label's right edge",
    ).toBeLessThan(1);
    expect(
      numberStyle.opacity,
      "number is fully visible after the reveal",
    ).toBe("1");

    const labelFontSize = await link
      .locator("[data-menu-item-label]")
      .evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    expect(
      numberStyle.fontSize,
      "number scales with but stays smaller than the label",
    ).toBeLessThan(labelFontSize);
  });

  test("menu numbers stay outlined and muted on hover", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/");

    // The toggle sits under the curtain while the preloader plays; wait for
    // the reveal to finish so the menu opens cleanly.
    await expect(page.locator("[data-curtain-content]")).toBeHidden({
      timeout: 15_000,
    });

    await page.locator("[data-hero-menu-toggle]").click();
    const panel = page.locator("#staggered-menu-panel");
    await expect(panel).toBeVisible();

    const link = panel.getByRole("link", { name: navigation[0].label });
    await expect(link).toBeVisible({ timeout: 2_000 });

    // Wait for the entrance cascade to settle (the number's rise is the last
    // tween per row) so the row is at rest before the hover check.
    await expect
      .poll(() =>
        link.evaluate((el) =>
          getComputedStyle(el).getPropertyValue("--sm-num-rise").trim(),
        ),
      )
      .toBe("0%");

    const numberScale = () =>
      link.evaluate((el) =>
        parseFloat(getComputedStyle(el).getPropertyValue("--sm-num-scale")),
      );
    const numberFill = () =>
      link.evaluate((el) =>
        getComputedStyle(el, "::before").getPropertyValue(
          "-webkit-text-fill-color",
        ),
      );

    await expect.poll(numberScale, "number rests at scale 1").toBe(1);
    await expect
      .poll(numberFill, "number is outlined before hover")
      .toBe("rgba(0, 0, 0, 0)");

    await link.hover();

    await expect.poll(numberScale, "number grows on hover").toBe(1.3);
    await expect
      .poll(numberFill, "number stays outlined on hover")
      .toBe("rgba(0, 0, 0, 0)");

    await page.mouse.move(0, 0);
    await expect.poll(numberScale, "number returns to rest on leave").toBe(1);
  });

  test("closes the staggered menu on toggle, escape and click-away", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator("[data-curtain-content]")).toBeHidden({
      timeout: 15_000,
    });

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

    // Wait for the app to mount (curtain dismissed) so the toggle click
    // always lands on the hydrated React handler.
    await expect(page.locator("[data-curtain-content]")).toBeHidden({
      timeout: 15_000,
    });

    await page.locator("[data-hero-menu-toggle]").click();
    const panel = page.locator("#staggered-menu-panel");
    await expect(panel).toBeVisible();

    const box = await panel.boundingBox();
    const viewport = page.viewportSize();
    if (!box || !viewport) throw new Error("Menu panel has no layout box");
    expect(box.width).toBeGreaterThanOrEqual(viewport.width - 1);
    expect(box.height).toBeGreaterThanOrEqual(viewport.height - 1);
  });

  test("renders the work section with header and per-project rows", async ({
    page,
  }) => {
    await page.goto("/");

    const section = page.locator("#work");
    await expect(section).toBeAttached();
    await page.evaluate(() => {
      document.querySelector("#work")?.scrollIntoView({ block: "start" });
    });

    const heading = page.locator("#work-heading");
    await expect(heading).toBeVisible();
    await expect(heading).toContainText(work.filledTitle);
    await expect(heading).toContainText(work.outlinedTitle);

    const railLabel = page.locator("#work [data-rail-label]");
    await expect(railLabel).toHaveText(work.index);
    if ((page.viewportSize()?.width ?? 0) >= 1024) {
      await expect(railLabel).toBeVisible();
    } else {
      await expect(railLabel).toBeHidden();
    }

    const rows = page.locator("[data-work-row]");
    await expect(rows).toHaveCount(projects.length);
    await expect(rows.first()).toHaveCSS(
      "background-color",
      "rgb(255, 255, 255)",
    );

    for (const project of projects) {
      const row = rows.filter({ hasText: project.title }).first();
      await expect(row).toBeVisible();
      await expect(row).toContainText(project.year);
      await expect(row).toContainText(project.description);
      await expect(row).toContainText(project.impact[0].value);

      const impact = row.locator("[data-work-impact]");
      await expect(impact.locator("[data-impact-stat]")).toHaveCount(
        project.impact.length,
      );

      for (const stat of project.impact) {
        await expect(
          impact.locator("[data-impact-stat]", { hasText: stat.value }),
        ).toContainText(stat.label);
      }

      const link = page.getByRole("link", { name: project.title });
      if (project.href) {
        await expect(link).toHaveAttribute("href", project.href);
      } else {
        await expect(link).toHaveCount(0);
      }
    }
  });

  test("renders editorial imagery without any white fade overlay", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/");

    await expect(page.locator("#work [data-image-reveal]")).toHaveCount(
      projects.length,
    );
    await expect(page.locator("#work [data-image-fade]")).toHaveCount(0);
    await expect(
      page.locator("[data-process-media] [data-image-reveal]"),
    ).toHaveCount(processSteps.length);
    await expect(
      page.locator("[data-process-media] [data-image-fade]"),
    ).toHaveCount(0);
    await expect(
      page.locator("[data-image-trail-overlay] .image-white-fade"),
    ).toHaveCount(0);
  });

  test("renders poster-backed videos for each process step", async ({
    page,
  }) => {
    await page.goto("/");

    const videos = page.locator("[data-process-media] [data-video-layer]");
    await expect(videos).toHaveCount(processSteps.length);

    for (const [index, step] of processSteps.entries()) {
      const video = videos.nth(index);
      await expect(video).toHaveAttribute(
        "src",
        new RegExp(step.video.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
      );
      await expect(video).toHaveAttribute(
        "poster",
        new RegExp(step.image.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
      );
      await expect(video).toHaveAttribute("preload", "none");
      await expect(video).toHaveAttribute("playsinline", "");
      await expect(video).toHaveAttribute("aria-hidden", "true");
    }
  });

  test("plays a process video on desktop hover and resets on leave", async ({
    page,
  }) => {
    test.skip((page.viewportSize()?.width ?? 0) < 810, "desktop hover only");
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/");

    const media = page.locator("[data-video-reveal]").first();
    const video = media.locator("[data-video-layer]");
    await media.scrollIntoViewIfNeeded();
    await media.hover();

    await expect
      .poll(() => media.getAttribute("data-video-status"), "video starts")
      .toBe("playing");
    await expect(video).toHaveJSProperty("paused", false);

    await page.mouse.move(0, 0);
    await expect
      .poll(() => media.getAttribute("data-video-status"), "video resets")
      .toBe("idle");
    await expect(video).toHaveJSProperty("paused", true);
  });

  test("keeps process videos paused when reduced motion is enabled", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");

    const media = page.locator("[data-video-reveal]").first();
    const video = media.locator("[data-video-layer]");
    await media.scrollIntoViewIfNeeded();
    await media.hover();

    await expect(media).toHaveAttribute("data-video-status", "idle");
    await expect(video).toHaveJSProperty("paused", true);
  });

  test("scales the previous work card as the next card reaches the sticky rail", async ({
    page,
  }) => {
    test.skip((page.viewportSize()?.width ?? 0) < 810, "desktop stack only");
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/");
    await expect(page.locator("[data-curtain-content]")).toBeHidden({
      timeout: 15_000,
    });

    const rows = page.locator("[data-work-row]");
    const viewportHeight = page.viewportSize()?.height ?? 0;
    const nextTop = await rows
      .nth(1)
      .evaluate(
        (element) => element.getBoundingClientRect().top + window.scrollY,
      );

    const scaleOf = () =>
      rows.first().evaluate((element) => {
        const transform = getComputedStyle(element).transform;
        if (transform === "none") return 1;
        return Number.parseFloat(
          transform.match(/^matrix\(([^,]+)/)?.[1] ?? "1",
        );
      });

    await page.evaluate(
      (y) => window.scrollTo(0, y),
      Math.max(0, Math.round(nextTop - viewportHeight - 20)),
    );
    await expect.poll(scaleOf).toBeGreaterThan(0.98);

    await page.evaluate((y) => window.scrollTo(0, y), Math.round(nextTop - 60));
    await expect.poll(scaleOf).toBeLessThanOrEqual(0.82);

    await expect(rows.first()).toHaveCSS("position", "sticky");
    await expect(rows.first()).toHaveCSS("top", "80px");
    await expect(rows.first()).toHaveCSS("z-index", "1");
  });

  test("keeps work cards in normal flow below the stack breakpoint", async ({
    page,
  }) => {
    test.skip((page.viewportSize()?.width ?? 0) >= 810, "mobile flow only");
    await page.goto("/");

    const rows = page.locator("[data-work-row]");
    await expect(rows).toHaveCount(projects.length);
    for (let index = 0; index < projects.length; index += 1) {
      await expect(rows.nth(index)).toHaveCSS("position", "relative");
      await expect(rows.nth(index)).toHaveCSS("transform", "none");
    }
  });

  test("work rail appears with the cards and fades away when the section ends", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator("[data-curtain-content]")).toBeHidden({
      timeout: 15_000,
    });
    await page.evaluate(() => document.fonts.ready);

    const rail = page.locator("#work [data-rail]");
    const viewportH = page.viewportSize()?.height ?? 0;
    const viewportW = page.viewportSize()?.width ?? 0;
    if ((page.viewportSize()?.width ?? 0) < 1024) {
      await expect(rail).toBeHidden();
      return;
    }

    const opacityOf = () =>
      rail.evaluate((element) =>
        Number.parseFloat(getComputedStyle(element).opacity),
      );

    await page.evaluate(() => window.scrollTo(0, 0));
    await expect
      .poll(opacityOf, "rail hidden while the hero is on screen")
      .toBe(0);

    const { cardsTopAbs, workBottomAbs, scrollable } = await page.evaluate(
      () => {
        const cards = document
          .querySelector("[data-work-cards]")
          ?.getBoundingClientRect();
        const work = document.querySelector("#work")?.getBoundingClientRect();
        return {
          cardsTopAbs: (cards?.top ?? 0) + window.scrollY,
          workBottomAbs: (work?.bottom ?? 0) + window.scrollY,
          scrollable:
            document.documentElement.scrollHeight - window.innerHeight,
        };
      },
    );

    const start = Math.max(0, cardsTopAbs - viewportH / 2 + 30);
    const workRailEnd = workBottomAbs - viewportH - 4;
    const end = Math.max(start, workRailEnd - 60);
    const offsets = [
      start,
      Math.round(start + (end - start) * 0.35),
      Math.round(start + (end - start) * 0.7),
      end,
    ];

    for (const offset of offsets) {
      await page.evaluate(
        (y) => window.scrollTo({ top: y, left: 0, behavior: "instant" }),
        offset,
      );
      await expect
        .poll(
          opacityOf,
          `rail visible while the cards are in view at scrollY=${offset}`,
        )
        .toBe(1);
      const box = await rail.boundingBox();
      expect(box).not.toBeNull();
      await expect
        .poll(async () => {
          const current = await rail.boundingBox();
          if (!current) return Number.POSITIVE_INFINITY;
          return Math.abs(current.y + current.height / 2 - viewportH / 2);
        }, `rail center stays at mid-viewport at scrollY=${offset}`)
        .toBeLessThanOrEqual(15);
      expect(
        box!.x,
        "work rail sits on the right side of the viewport",
      ).toBeGreaterThan(viewportW / 2);
    }

    await page.evaluate(
      (y) => window.scrollTo(0, y),
      Math.min(scrollable, workRailEnd + 20),
    );
    await expect
      .poll(opacityOf, "rail gone once the next section would start showing")
      .toBe(0);
  });

  test("work row info is bottom-aligned without a title underline", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator("[data-curtain-content]")).toBeHidden({
      timeout: 15_000,
    });

    const row = page.locator("[data-work-row]").first();
    await expect(row).toBeAttached();
    await page.evaluate(() => {
      document
        .querySelector("[data-work-row]")
        ?.scrollIntoView({ block: "center" });
    });
    await expect(row).toBeInViewport();

    const rowBox = await row.boundingBox();
    const infoBox = await row.locator("[data-work-info]").boundingBox();
    expect(rowBox).not.toBeNull();
    expect(infoBox).not.toBeNull();
    expect(infoBox!.y + infoBox!.height).toBeCloseTo(
      rowBox!.y + rowBox!.height,
      0,
    );
    await expect(page.locator("[data-work-underline]")).toHaveCount(0);
  });

  test("shows faded outlined numerals inside the info column and local project images", async ({
    page,
  }) => {
    await page.goto("/");

    const rows = page.locator("[data-work-row]");
    await expect(rows).toHaveCount(projects.length);

    for (const [index, project] of projects.entries()) {
      const row = rows.filter({ hasText: project.title }).first();
      await row.evaluate((element) =>
        element.scrollIntoView({ block: "center" }),
      );

      await expect(row).toHaveCSS("border-top-width", "0px");

      const info = row.locator("[data-work-info]");
      await expect(info).toBeVisible();

      const numeral = row.locator("[data-work-index]");
      if ((page.viewportSize()?.width ?? 0) >= 1024) {
        await expect(numeral).toBeVisible();
        await expect(numeral).toHaveAttribute(
          "data-value",
          String(index + 1).padStart(2, "0"),
        );
        await expect(numeral.locator("[data-odometer-strip]")).toHaveCount(2);

        const { infoBox, numeralBox, contentBox } = await row.evaluate(
          (element) => {
            const infoRect = element
              .querySelector("[data-work-info]")!
              .getBoundingClientRect();
            const numeralRect = element
              .querySelector("[data-work-index]")!
              .getBoundingClientRect();
            const contentRect = element
              .querySelector("[data-work-content]")!
              .getBoundingClientRect();
            return {
              infoBox: {
                x: infoRect.x,
                y: infoRect.y,
                width: infoRect.width,
                height: infoRect.height,
              },
              numeralBox: {
                x: numeralRect.x,
                y: numeralRect.y,
                width: numeralRect.width,
                height: numeralRect.height,
              },
              contentBox: { y: contentRect.y, height: contentRect.height },
            };
          },
        );

        expect(
          Math.abs(
            numeralBox.x + numeralBox.width - (infoBox.x + infoBox.width),
          ),
          `${project.title}: numeral sits at the top-right corner of the info column`,
        ).toBeLessThanOrEqual(2);
        expect(
          Math.abs(numeralBox.y - infoBox.y),
          `${project.title}: numeral aligns to the top of the info column`,
        ).toBeLessThanOrEqual(2);
        expect(
          infoBox.y + infoBox.height - (contentBox.y + contentBox.height),
          `${project.title}: info content stays bottom-aligned (pb-2 padding only)`,
        ).toBeLessThanOrEqual(10);
      } else {
        await expect(numeral).toBeHidden();
      }

      const img = row.locator("[data-work-figure] img");
      await expect(img).toHaveCount(1);
      await expect(img).toHaveAttribute(
        "src",
        new RegExp(project.image!.split("/").pop()!.replace(/\./g, "\\.")),
      );
      await expect(img).toHaveAttribute(
        "loading",
        index === 0 ? "eager" : "lazy",
      );
      await expect(img).toHaveCSS("object-fit", "contain");
    }
  });

  test("renders impact stats in black with hairline separators", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator("[data-curtain-content]")).toBeHidden({
      timeout: 15_000,
    });

    await page.evaluate(() => {
      document
        .querySelector("[data-work-row]")
        ?.scrollIntoView({ block: "center" });
    });
    await expect
      .poll(() =>
        page.evaluate(() => {
          const row = document.querySelector("[data-work-row]");
          return row ? getComputedStyle(row).opacity : "";
        }),
      )
      .toBe("1");

    const impact = page.locator("[data-work-impact]").first();
    await expect(impact.locator("[data-impact-stat]")).toHaveCount(
      projects[0].impact.length,
    );

    const values = impact.locator("[data-impact-value]");
    await expect(values).toHaveCount(projects[0].impact.length);
    for (const stat of projects[0].impact) {
      await expect(
        impact.locator("[data-impact-value]", { hasText: stat.value }),
      ).toHaveCSS("color", "rgb(0, 0, 0)");
    }

    const separators = await impact
      .locator("[data-impact-stat]")
      .evaluateAll((stats) =>
        stats.map(
          (stat) =>
            getComputedStyle(stat).borderTopStyle +
            " " +
            getComputedStyle(stat).borderTopColor,
        ),
      );
    expect(separators.every((value) => value.includes("solid"))).toBe(true);
  });

  test("rolls impact stats from zero on scroll entry", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/");
    await expect(page.locator("[data-curtain-content]")).toBeHidden({
      timeout: 15_000,
    });

    await page.evaluate(() => {
      document
        .querySelector("[data-work-row]")
        ?.scrollIntoView({ block: "center" });
    });

    const firstValue = page
      .locator("[data-work-impact]")
      .first()
      .locator("[data-impact-value]")
      .first();
    const core =
      projects[0].impact[0].value.match(/^[^\d]*([\d.]+)/)?.[1] ?? "";
    const strips = firstValue.locator("[data-odometer-strip]");
    await expect(strips).toHaveCount(core.length);

    const firstStrip = strips.first();
    await expect
      .poll(() => stripY(firstStrip), "odometer catches the roll mid-flight")
      .toBeGreaterThan((await stripTarget(firstStrip)) + 1);

    const count = await strips.count();
    for (let index = 0; index < count; index += 1) {
      const strip = strips.nth(index);
      const digit = Number(await strip.getAttribute("data-digit"));
      await expect
        .poll(() => visibleDigit(strip), `impact digit column ${index} settles`)
        .toBe(digit);
    }
  });

  test("rolls each card numeral from zero on scroll entry", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/");
    await expect(page.locator("[data-curtain-content]")).toBeHidden({
      timeout: 15_000,
    });

    const rows = page.locator("[data-work-row]");
    await expect(rows).toHaveCount(projects.length);

    for (const [index, project] of projects.entries()) {
      const numeral = rows
        .filter({ hasText: project.title })
        .first()
        .locator("[data-work-index]");
      await expect(numeral).toHaveCount(1);

      await rows
        .filter({ hasText: project.title })
        .first()
        .evaluate((element) => element.scrollIntoView({ block: "center" }));

      const strips = numeral.locator("[data-odometer-strip]");
      await expect(strips).toHaveCount(2);

      if (!(await numeral.isVisible())) {
        await expect(numeral).toBeHidden();
        continue;
      }

      const count = await strips.count();
      for (let stripIndex = 0; stripIndex < count; stripIndex += 1) {
        const strip = strips.nth(stripIndex);
        const digit = Number(await strip.getAttribute("data-digit"));
        await expect
          .poll(
            () => visibleDigit(strip),
            `numeral column ${stripIndex} of card ${index} settles`,
          )
          .toBe(digit);
      }
    }
  });

  test("renders the layered contact footer with a fully visible H.dev brand", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/");
    await expect(page.locator("[data-curtain-content]")).toBeHidden({
      timeout: 15_000,
    });

    const contact = page.locator("#contact");
    const footer = page.locator("[data-site-footer]");
    const brand = footer.locator("[data-footer-brand]");

    await brand.scrollIntoViewIfNeeded();

    await expect(contact).toBeAttached();
    await expect(contact).toContainText(profile.tagline);
    await expect(contact).toContainText(profile.email);
    await expect(contact).toContainText(profile.availability);
    await expect(contact).not.toContainText("Based in");
    await expect(contact).not.toContainText("Elsewhere");
    await expect(contact).not.toContainText("Navigate");
    await expect(contact.locator("[data-contact-stage]")).toHaveCSS(
      "background-color",
      "rgb(255, 255, 255)",
    );
    await expect(contact.locator("[data-contact-stage] canvas")).toHaveCount(0);
    await expect(contact.locator("[data-contact-cta] a")).toHaveAttribute(
      "href",
      `mailto:${profile.email}`,
    );
    await expect(contact.locator("[data-contact-cta] a")).toContainText(
      contactContent.ctaLabel,
    );
    await expect(contact.locator("[data-contact-email]")).toHaveAttribute(
      "href",
      `mailto:${profile.email}`,
    );
    const stageBounds = await contact
      .locator("[data-contact-stage]")
      .evaluate((element) => {
        const rect = element.getBoundingClientRect();
        return { left: rect.left, right: rect.right };
      });
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(stageBounds.left).toBe(0);
    expect(stageBounds.right).toBe(viewportWidth);
    const contactPadding = await contact.evaluate((element) => {
      const styles = getComputedStyle(element);
      return { top: styles.paddingTop, bottom: styles.paddingBottom };
    });
    expect(contactPadding.top).toBe("0px");
    expect(Number.parseFloat(contactPadding.bottom)).toBeGreaterThan(0);
    const contactGridPadding = await contact
      .locator("[data-contact-stage] > div")
      .evaluate((element) => {
        const styles = getComputedStyle(element);
        return {
          top: styles.paddingTop,
          right: styles.paddingRight,
          bottom: styles.paddingBottom,
          left: styles.paddingLeft,
        };
      });
    if ((page.viewportSize()?.width ?? 0) >= 1024) {
      expect(contactGridPadding).toEqual({
        top: "0px",
        right: "0px",
        bottom: "0px",
        left: "0px",
      });
    } else {
      expect(Number.parseFloat(contactGridPadding.left)).toBeGreaterThan(0);
      expect(Number.parseFloat(contactGridPadding.right)).toBeGreaterThan(0);
    }
    await expect(brand).toHaveText(profile.brand);
    const contactColumns = await contact
      .locator("[data-contact-reveal]")
      .evaluateAll((elements) =>
        elements.map((element) => element.getBoundingClientRect().left),
      );
    await expect
      .poll(
        () =>
          contact.locator("[data-contact-stage]").evaluate((stage) => {
            const stageRect = stage.getBoundingClientRect();
            const stageCenter = stageRect.top + stageRect.height / 2;
            const rects = [
              ...stage.querySelectorAll<HTMLElement>("[data-contact-reveal]"),
            ].map((element) => element.getBoundingClientRect());
            if ((window.innerWidth ?? 0) >= 1024) {
              return rects.every(
                (rect) =>
                  Math.abs(rect.top + rect.height / 2 - stageCenter) <= 2,
              );
            }

            const contentTop = Math.min(...rects.map((rect) => rect.top));
            const contentBottom = Math.max(...rects.map((rect) => rect.bottom));
            return (
              Math.abs((contentTop + contentBottom) / 2 - stageCenter) <= 2
            );
          }),
        "contact content is vertically centered in the stage",
      )
      .toBe(true);
    if ((page.viewportSize()?.width ?? 0) >= 1024) {
      expect(contactColumns[1]).toBeGreaterThan(contactColumns[0]);
    } else {
      expect(contactColumns[1]).toBe(contactColumns[0]);
    }

    await expect(contact.locator("[data-rail]")).toHaveCount(0);
    await expect(contact.locator("[data-contact-stage]")).toHaveCSS(
      "border-top-width",
      "0px",
    );
    await expect(contact.locator("[data-contact-stage]")).toHaveCSS(
      "border-bottom-width",
      "0px",
    );
    await expect(contact.locator("[data-contact-stage]")).toHaveCSS(
      "border-left-width",
      "1px",
    );
    await expect(footer.locator("[data-footer-stage]")).toHaveCSS(
      "border-top-width",
      "0px",
    );
    await expect(footer.locator("[data-footer-stage]")).toHaveCSS(
      "border-bottom-width",
      "0px",
    );
    await expect(footer.locator("[data-footer-stage]")).toHaveCSS(
      "padding-top",
      "0px",
    );
    await expect(footer.locator("[data-footer-stage]")).toHaveCSS(
      "padding-bottom",
      "0px",
    );
    await expect(footer.locator("[data-footer-stage]")).toHaveCSS(
      "overflow",
      "visible",
    );

    await expect
      .poll(() =>
        brand.evaluate((element) => {
          const styles = getComputedStyle(element);
          return styles.maskImage || styles.webkitMaskImage;
        }),
      )
      .toBe("none");
    const brandWash = footer.locator("[data-footer-brand-wash]");
    await expect(brandWash).toHaveAttribute("aria-hidden", "true");
    await expect(brandWash).toHaveCSS("background-color", "rgb(255, 255, 255)");
    await expect
      .poll(() =>
        brandWash.evaluate((element) => getComputedStyle(element).filter),
      )
      .toMatch(/^blur\(.+\)$/);

    await expect
      .poll(() =>
        brand.evaluate((element) => getComputedStyle(element).opacity),
      )
      .toBe("1");

    await page.evaluate(() =>
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: "instant",
      }),
    );

    await expect
      .poll(
        () =>
          footer.evaluate((element) => {
            const stage = element.querySelector<HTMLElement>(
              "[data-footer-stage]",
            );
            const brand = element.querySelector<HTMLElement>(
              "[data-footer-brand]",
            );
            const reveal = element.querySelector<HTMLElement>(
              "[data-footer-brand-reveal]",
            );
            const contact = document.querySelector<HTMLElement>("#contact");
            if (!stage || !brand || !reveal || !contact) return false;

            const stageRect = stage.getBoundingClientRect();
            const brandRect = brand.getBoundingClientRect();
            const contactRect = contact.getBoundingClientRect();
            const styles = getComputedStyle(brand);
            const revealStyles = getComputedStyle(reveal);
            const transform = revealStyles.transform;
            const translateY =
              transform === "none" ? 0 : new DOMMatrixReadOnly(transform).m42;
            const fontSize = Number.parseFloat(styles.fontSize);
            const lineHeight = Number.parseFloat(styles.lineHeight);
            const bottomOffset = Number.parseFloat(revealStyles.bottom);
            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");
            if (!context) return false;
            context.font = `${styles.fontWeight} ${styles.fontSize} ${styles.fontFamily}`;
            const metrics = context.measureText(brand.textContent ?? "");
            const fontMetricsHeight =
              metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent;
            const baseline =
              brandRect.top +
              (lineHeight - fontMetricsHeight) / 2 +
              metrics.fontBoundingBoxAscent;
            const inkTop = baseline - metrics.actualBoundingBoxAscent;
            const inkBottom = baseline + metrics.actualBoundingBoxDescent;
            const topClearance = inkTop - contactRect.bottom;
            const expectedTopSpace = Math.min(
              48,
              Math.max(24, window.innerWidth * 0.035),
            );
            const stageTopSpace = stageRect.height - fontSize * 0.75;

            return (
              Math.abs(translateY) <= 1 &&
              Math.abs(lineHeight - fontSize) <= 1 &&
              Math.abs(stageTopSpace - expectedTopSpace) <= 1 &&
              Math.abs(bottomOffset + fontSize * 0.1) <= 1 &&
              inkTop >= stageRect.top - 1 &&
              topClearance >= expectedTopSpace &&
              topClearance <= expectedTopSpace + 8 &&
              Math.abs(inkBottom - stageRect.bottom) <= 2
            );
          }),
        "footer ink clears the contact seam and meets the document bottom",
      )
      .toBe(true);

    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(hasOverflow).toBe(false);
  });

  test("reveals both contact columns on scroll entry", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/");
    await expect(page.locator("[data-curtain-content]")).toBeHidden({
      timeout: 15_000,
    });

    const targets = page.locator("[data-contact-reveal]");
    await expect(targets).toHaveCount(2);

    for (const target of [targets.first(), targets.last()]) {
      expect(await opacityOf(target)).toBeLessThan(0.05);
      expect(await translateY(target)).toBeGreaterThan(90);
    }

    await targets
      .first()
      .evaluate((element) => element.scrollIntoView({ block: "center" }));

    for (const target of [targets.first(), targets.last()]) {
      await expect.poll(() => opacityOf(target)).toBeGreaterThan(0.99);
      await expect.poll(() => translateY(target)).toBeGreaterThanOrEqual(-0.5);
      await expect.poll(() => translateY(target)).toBeLessThanOrEqual(0.5);
    }
  });

  test("slides the complete footer brand from beneath the stationary contact", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/");
    await expect(page.locator("[data-curtain-content]")).toBeHidden({
      timeout: 15_000,
    });

    const contact = page.locator("#contact");
    const stage = page.locator("[data-site-footer] [data-footer-stage]");
    const brandReveal = page.locator(
      "[data-site-footer] [data-footer-brand-reveal]",
    );
    const contactTransform = () =>
      contact.evaluate((element) => getComputedStyle(element).transform);
    const brandY = () => translateY(brandReveal);
    const contactFooterGap = () =>
      page.evaluate(() => {
        const contact = document.querySelector("#contact");
        const footer = document.querySelector("[data-site-footer]");
        if (!contact || !footer) return Number.POSITIVE_INFINITY;
        return (
          footer.getBoundingClientRect().top -
          contact.getBoundingClientRect().bottom
        );
      });
    const canAnimate = await page.evaluate(
      () =>
        window.matchMedia(
          "(min-width: 810px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
        ).matches,
    );

    await expect
      .poll(contactTransform)
      .toMatch(/^(none|matrix\(1, 0, 0, 1, 0, 0\))$/);

    const hiddenBrandY = await stage.evaluate((element) => {
      const contact = document.querySelector<HTMLElement>("#contact");
      if (!contact) return 0;

      const stageRect = element.getBoundingClientRect();
      const overlap = Math.min(
        stageRect.height,
        Math.max(0, contact.getBoundingClientRect().bottom - stageRect.top),
      );
      return -(stageRect.height - overlap);
    });
    const initialBrandY = await brandY();
    if (canAnimate) {
      expect(Math.abs(hiddenBrandY)).toBeGreaterThan(
        (await stage.evaluate((element) => element.offsetHeight)) * 0.65,
      );
      expect(initialBrandY).toBeCloseTo(hiddenBrandY, 0);
    } else {
      expect(initialBrandY).toBeCloseTo(0, 0);
    }

    const scrollRange = await stage.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      const top = rect.top + window.scrollY - window.innerHeight;
      return { start: top, distance: rect.height };
    });
    await page.evaluate(
      ({ start, distance }) =>
        window.scrollTo({
          top: start + distance * 0.55,
          behavior: "instant",
        }),
      scrollRange,
    );

    if (canAnimate) {
      await expect
        .poll(brandY, { timeout: 5_000 })
        .toBeGreaterThan(initialBrandY);
      await expect
        .poll(brandY, { timeout: 5_000 })
        .toBeCloseTo(hiddenBrandY * 0.45, 0);
    } else {
      await expect.poll(brandY, { timeout: 5_000 }).toBeCloseTo(0, 0);
    }
    await expect
      .poll(contactTransform)
      .toMatch(/^(none|matrix\(1, 0, 0, 1, 0, 0\))$/);

    await page.evaluate(() =>
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: "instant",
      }),
    );
    await expect.poll(brandY, { timeout: 5_000 }).toBeCloseTo(0, 0);
    await expect.poll(contactFooterGap).toBeCloseTo(0, 0);

    await page.locator("#home").scrollIntoViewIfNeeded();

    if (canAnimate) {
      await expect
        .poll(brandY, { timeout: 5_000 })
        .toBeCloseTo(hiddenBrandY, 0);
    } else {
      await expect.poll(brandY, { timeout: 5_000 }).toBeCloseTo(0, 0);
    }
  });
});

test.describe("services", () => {
  test("renders after work with the right-aligned heading and left rail", async ({
    page,
  }) => {
    await page.goto("/");

    const section = page.locator("#services");
    await expect(section).toBeAttached();
    await expect(section.locator("#services-heading")).toContainText(
      servicesSection.filledTitle,
    );
    await expect(section.locator("#services-heading")).toContainText(
      servicesSection.outlinedTitle,
    );
    await expect(section.locator("[data-service-interaction]")).toContainText(
      servicesSection.label,
    );
    await expect(section.locator("[data-service-interaction]")).toContainText(
      String(services.length).padStart(2, "0"),
    );

    const divider = section.locator("[data-service-header-divider]");
    const serviceList = section.locator("[data-service-list]");
    await expect(divider).toBeVisible();
    await expect(serviceList).toBeVisible();
    const dividerBox = await divider.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return { y: rect.y, height: rect.height };
    });
    const listBox = await serviceList.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return { y: rect.y };
    });
    expect(listBox.y).toBeCloseTo(dividerBox.y + dividerBox.height, 0);

    const workTop = await page
      .locator("#work")
      .evaluate(
        (element) => element.getBoundingClientRect().top + window.scrollY,
      );
    const servicesTop = await section.evaluate(
      (element) => element.getBoundingClientRect().top + window.scrollY,
    );
    expect(servicesTop).toBeGreaterThan(workTop);

    const rail = section.locator("[data-rail]");
    await expect(rail.locator("[data-rail-label]")).toHaveText(
      servicesSection.index,
    );
    if ((page.viewportSize()?.width ?? 0) >= 1024) {
      await expect(rail).toBeVisible();
      const railBox = await rail.boundingBox();
      expect(railBox).not.toBeNull();
      expect(railBox!.x).toBeLessThan((page.viewportSize()?.width ?? 0) / 2);
    } else {
      await expect(rail).toBeHidden();
    }
  });

  test("switches the active service and detail panel on hover", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator("[data-curtain-content]")).toBeHidden({
      timeout: 15_000,
    });

    const section = page.locator("#services");
    const rows = section.locator("[data-service-row]");
    await section.scrollIntoViewIfNeeded();
    await expect(rows).toHaveCount(services.length);
    await expect(rows.first()).toHaveAttribute("aria-pressed", "true");

    for (const [index, service] of services.entries()) {
      const row = rows.nth(index);
      await expect(row).toContainText(service.title);
      const icon = row.locator("[data-service-icon]");
      await expect(icon).toBeVisible();
      await expect(icon).toHaveAttribute(
        "data-image-source",
        serviceIconSources[service.icon].src,
      );
      const iconFrame = row.locator("[data-service-icon-frame]");
      const iconBox = await icon.boundingBox();
      const iconFrameBox = await iconFrame.boundingBox();
      const titleFontSize = await row
        .locator("[data-service-title]")
        .evaluate((element) =>
          Number.parseFloat(getComputedStyle(element).fontSize),
        );
      expect(iconBox?.width ?? 0).toBeGreaterThan(0);
      expect(
        Math.abs((iconFrameBox?.width ?? 0) - titleFontSize),
      ).toBeLessThanOrEqual(1);
      expect(iconBox?.width ?? 0).toBeGreaterThan(titleFontSize * 1.15);
    }

    if ((page.viewportSize()?.width ?? 0) >= 1024) {
      await rows.nth(1).hover();
      await expect(rows.nth(0)).toHaveAttribute("aria-pressed", "false");
      await expect(rows.nth(1)).toHaveAttribute("aria-pressed", "true");
      await expect(
        section.locator("[data-service-detail-panel]"),
      ).toContainText(services[1].description);
      await expect(section.locator("[data-service-pointer-card]")).toHaveCount(
        0,
      );

      const trailItems = section.locator("[data-image-trail-item]");
      await expect
        .poll(
          () => trailItems.count(),
          "image trail spawns on capability hover",
        )
        .toBeGreaterThan(0);

      const trailSource = await trailItems
        .first()
        .locator("[data-image-source]")
        .getAttribute("data-image-source");
      expect(trailSource).toBe(services[1].image);

      const rowTrail = section.locator("[data-service-row-trail]").nth(1);
      await expect(rowTrail).toHaveCSS("overflow", "hidden");
      const trailBounds = await rowTrail.evaluate((element) => {
        const root = element.getBoundingClientRect();
        const overlay = element
          .querySelector("[data-image-trail-overlay]")!
          .getBoundingClientRect();
        return {
          root: {
            x: root.x,
            y: root.y,
            width: root.width,
            height: root.height,
          },
          overlay: {
            x: overlay.x,
            y: overlay.y,
            width: overlay.width,
            height: overlay.height,
          },
        };
      });
      expect(trailBounds.overlay).toEqual(trailBounds.root);
    }
  });

  test("keeps the service selector usable on mobile without horizontal overflow", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    const section = page.locator("#services");
    await section.scrollIntoViewIfNeeded();
    await expect(section.locator("[data-service-row]")).toHaveCount(
      services.length,
    );
    await expect(section.locator("[data-service-detail-panel]")).toBeVisible();
    await expect(section.locator("[data-image-trail-overlay]")).toHaveCount(
      services.length,
    );
    await expect(
      section.locator("[data-image-trail-overlay]:visible"),
    ).toHaveCount(0);

    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(hasOverflow).toBe(false);

    const selectedRow = section.locator("[data-service-row]").nth(2);
    await selectedRow.scrollIntoViewIfNeeded();
    await selectedRow.click();
    await expect(section.locator("[data-service-row]").nth(2)).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(section.locator("[data-service-detail-panel]")).toContainText(
      services[2].description,
    );
  });

  test("does not spawn the image trail when reduced motion is enabled", async ({
    page,
  }) => {
    test.skip((page.viewportSize()?.width ?? 0) < 1024, "desktop hover only");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");

    const section = page.locator("#services");
    await section.scrollIntoViewIfNeeded();
    await section.locator("[data-service-row]").first().hover();

    await expect(section.locator("[data-image-trail-item]")).toHaveCount(0);
  });
});

test.describe("stack", () => {
  test("renders the What I Use bento after services with a right rail", async ({
    page,
  }) => {
    await page.goto("/");

    const section = page.locator("#stack");
    await expect(section).toBeAttached();
    await expect(section.locator("#stack-heading")).toContainText(
      stackSection.filledTitle,
    );
    await expect(section.locator("#stack-heading")).toContainText(
      stackSection.outlinedTitle,
    );
    await expect(section).not.toContainText("TOOLS & SYSTEMS");
    await expect(section.locator("[data-magic-bento]")).toBeVisible();
    await expect(section.locator("[data-bento-cell]")).toHaveCount(
      stackCapabilities.length,
    );

    for (const capability of stackCapabilities) {
      const card = section
        .locator("[data-stack-card]")
        .nth(stackCapabilities.indexOf(capability));
      await expect(card).toContainText(capability.title);
      await expect(card).toContainText(capability.description);
      await expect(card.locator("[data-stack-icon]")).toHaveCount(1);
      await expect(card.locator("[data-tech-avatar]")).toHaveCount(
        capability.tools.length,
      );
    }

    const servicesTop = await page
      .locator("#services")
      .evaluate(
        (element) => element.getBoundingClientRect().top + window.scrollY,
      );
    const stackTop = await section.evaluate(
      (element) => element.getBoundingClientRect().top + window.scrollY,
    );
    expect(stackTop).toBeGreaterThan(servicesTop);

    const rail = section.locator("[data-rail]");
    await expect(rail.locator("[data-rail-label]")).toHaveText(
      stackSection.index,
    );
    if ((page.viewportSize()?.width ?? 0) >= 1024) {
      const gridBox = await section.locator("[data-magic-bento]").boundingBox();
      const firstCellBox = await section
        .locator("[data-bento-cell]")
        .nth(0)
        .boundingBox();
      const secondCellBox = await section
        .locator("[data-bento-cell]")
        .nth(1)
        .boundingBox();
      const firstIconBox = await section
        .locator("[data-stack-icon]")
        .nth(0)
        .boundingBox();
      const secondIconBox = await section
        .locator("[data-stack-icon]")
        .nth(1)
        .boundingBox();
      const firstTitleBox = await section
        .locator("[data-stack-title]")
        .nth(0)
        .boundingBox();
      const secondTitleBox = await section
        .locator("[data-stack-title]")
        .nth(1)
        .boundingBox();
      const firstDescriptionBox = await section
        .locator("[data-stack-description]")
        .nth(0)
        .boundingBox();
      const secondDescriptionBox = await section
        .locator("[data-stack-description]")
        .nth(1)
        .boundingBox();
      const cellBoxes = await section
        .locator("[data-bento-cell]")
        .evaluateAll((elements) =>
          elements.map((element) => element.getBoundingClientRect().bottom),
        );
      const toolBottoms = await section
        .locator("[data-stack-tools]")
        .evaluateAll((elements) =>
          elements.map((element) => element.getBoundingClientRect().bottom),
        );
      const titleSizes = await section
        .locator("[data-stack-title]")
        .evaluateAll((elements) =>
          elements.map((element) =>
            Number.parseFloat(getComputedStyle(element).fontSize),
          ),
        );
      const titleLineCounts = await section
        .locator("[data-stack-title]")
        .evaluateAll((elements) =>
          elements.map((element) => {
            const style = getComputedStyle(element);
            return Math.round(
              element.getBoundingClientRect().height /
                parseFloat(style.lineHeight),
            );
          }),
        );
      const descriptionHeights = await section
        .locator("[data-stack-description]")
        .evaluateAll((elements) =>
          elements.map((element) => element.getBoundingClientRect().height),
        );
      const iconColors = await section
        .locator("[data-stack-icon]")
        .evaluateAll((elements) =>
          elements.map((element) => getComputedStyle(element).color),
        );
      expect(gridBox).not.toBeNull();
      expect(firstCellBox).not.toBeNull();
      expect(secondCellBox).not.toBeNull();
      expect(firstIconBox).not.toBeNull();
      expect(secondIconBox).not.toBeNull();
      expect(firstTitleBox).not.toBeNull();
      expect(secondTitleBox).not.toBeNull();
      expect(firstDescriptionBox).not.toBeNull();
      expect(secondDescriptionBox).not.toBeNull();
      expect(gridBox!.width).toBeGreaterThan(gridBox!.height);
      expect(
        Math.abs(firstCellBox!.width - secondCellBox!.width),
      ).toBeGreaterThan(1);
      const firstIconTop = firstCellBox!.y - firstIconBox!.y;
      const firstIconRight =
        firstIconBox!.x +
        firstIconBox!.width -
        (firstCellBox!.x + firstCellBox!.width);
      const secondIconTop = secondCellBox!.y - secondIconBox!.y;
      const secondIconRight =
        secondIconBox!.x +
        secondIconBox!.width -
        (secondCellBox!.x + secondCellBox!.width);
      const firstVisibleWidth =
        (firstCellBox!.x + firstCellBox!.width - firstIconBox!.x) /
        firstIconBox!.width;
      const firstVisibleHeight =
        (firstIconBox!.y + firstIconBox!.height - firstCellBox!.y) /
        firstIconBox!.height;
      const secondVisibleWidth =
        (secondCellBox!.x + secondCellBox!.width - secondIconBox!.x) /
        secondIconBox!.width;
      const secondVisibleHeight =
        (secondIconBox!.y + secondIconBox!.height - secondCellBox!.y) /
        secondIconBox!.height;
      expect(firstIconTop).toBeGreaterThan(0);
      expect(secondIconTop).toBeGreaterThan(0);
      expect(firstIconRight).toBeGreaterThan(0);
      expect(secondIconRight).toBeGreaterThan(0);
      expect(firstVisibleWidth).toBeGreaterThan(0.6);
      expect(firstVisibleHeight).toBeGreaterThan(0.6);
      expect(secondVisibleWidth).toBeGreaterThan(0.6);
      expect(secondVisibleHeight).toBeGreaterThan(0.6);
      expect(new Set(iconColors).size).toBe(1);
      expect(firstTitleBox!.y - firstCellBox!.y).toBeLessThan(80);
      expect(secondTitleBox!.y - secondCellBox!.y).toBeLessThan(80);
      expect(titleSizes[0]).toBeGreaterThan(titleSizes[1]);
      expect(titleLineCounts.every((count) => count === 1)).toBe(true);
      expect(
        Math.max(...descriptionHeights) - Math.min(...descriptionHeights),
      ).toBeLessThan(1);
      expect(firstTitleBox!.x + firstTitleBox!.width).toBeLessThan(
        firstIconBox!.x,
      );
      const bottomGaps = cellBoxes.map(
        (bottom, index) => bottom - toolBottoms[index],
      );
      expect(Math.max(...bottomGaps) - Math.min(...bottomGaps)).toBeLessThan(1);

      await expect(rail).toBeVisible();
      const railBox = await rail.boundingBox();
      expect(railBox).not.toBeNull();
      expect(railBox!.x).toBeGreaterThan((page.viewportSize()?.width ?? 0) / 2);
    } else {
      await expect(rail).toBeHidden();
    }
  });

  test("slides the ghost icon fully into view on hover without changing its fade", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator("[data-curtain-content]")).toBeHidden({
      timeout: 15_000,
    });

    const card = page.locator("[data-stack-card]").first();
    await card.scrollIntoViewIfNeeded();
    await card.hover({ force: true });
    await page.waitForTimeout(900);

    const hovered = await card.evaluate((el) => {
      const cardRect = el.getBoundingClientRect();
      const iconRect = el
        .querySelector("[data-stack-icon]")!
        .getBoundingClientRect();
      return {
        rightInside: iconRect.right <= cardRect.right + 0.5,
        topInside: iconRect.top >= cardRect.top - 0.5,
        color: getComputedStyle(el.querySelector("[data-stack-icon]")!).color,
      };
    });
    expect(hovered.rightInside).toBe(true);
    expect(hovered.topInside).toBe(true);
    expect(hovered.color).toContain("0.03");

    await page.mouse.move(10, 10);
    await page.waitForTimeout(900);

    const idle = await card.evaluate((el) => {
      const cardRect = el.getBoundingClientRect();
      const iconRect = el
        .querySelector("[data-stack-icon]")!
        .getBoundingClientRect();
      return {
        bleedsRight: iconRect.right > cardRect.right + 0.5,
        bleedsTop: iconRect.top < cardRect.top - 0.5,
        color: getComputedStyle(el.querySelector("[data-stack-icon]")!).color,
      };
    });
    expect(idle.bleedsRight).toBe(true);
    expect(idle.bleedsTop).toBe(true);
    expect(idle.color).toContain("0.03");
  });

  test("keeps the bento usable on mobile without horizontal overflow", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    const section = page.locator("#stack");
    await expect(section.locator("[data-bento-cell]")).toHaveCount(
      stackCapabilities.length,
    );
    await expect(section.locator("[data-tech-stack]").first()).toBeVisible();

    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(hasOverflow).toBe(false);
  });
});

test.describe("how I work", () => {
  test("renders the reference-inspired process flow after stack", async ({
    page,
  }) => {
    await page.goto("/");

    const section = page.locator("#how-i-work");
    await expect(section).toBeAttached();
    await expect(section.locator("[data-process-label]")).toHaveText(
      `${processSection.index} / PROCESS`,
    );
    await expect(section.locator("#how-i-work-heading")).toContainText(
      processSection.filledTitle,
    );
    await expect(section.locator("#how-i-work-heading")).toContainText(
      processSection.outlinedTitle,
    );
    await expect(section.locator("#how-i-work-heading")).toHaveCSS(
      "white-space",
      "nowrap",
    );
    await expect(section.locator("#how-i-work-heading")).toHaveCSS(
      "text-align",
      "right",
    );

    const steps = section.locator("[data-process-step]");
    await expect(steps).toHaveCount(processSteps.length);
    await expect(section.locator("[data-process-desktop-track]")).toHaveCount(
      processSteps.length,
    );
    await expect(
      section.locator("[data-process-horizontal-track]"),
    ).toHaveCount(processSteps.length - 1);

    for (const [index, step] of processSteps.entries()) {
      const row = steps.nth(index);
      await expect(row).toContainText(step.title);
      await expect(row).toContainText(step.description);
      const iconBox = await row.locator("[data-process-icon]").boundingBox();
      const titleBox = await row.locator("h3").boundingBox();
      expect(iconBox).not.toBeNull();
      expect(titleBox).not.toBeNull();
      expect(
        Math.abs((iconBox?.height ?? 0) - (titleBox?.height ?? 0)),
        `${step.title}: title height matches icon height`,
      ).toBeLessThanOrEqual(1);

      if ((page.viewportSize()?.width ?? 0) >= 768) {
        const descriptionLines = await row
          .locator("p[data-process-copy]")
          .evaluate((element) => {
            const lineHeight = Number.parseFloat(
              getComputedStyle(element).lineHeight,
            );
            return Math.round(
              element.getBoundingClientRect().height / lineHeight,
            );
          });
        expect(
          descriptionLines,
          `${step.title}: description uses three lines`,
        ).toBe(3);
      }

      await expect(row.locator("[data-process-media] img")).toHaveAttribute(
        "src",
        new RegExp(
          encodeURIComponent(step.image).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        ),
      );
      await expect(row.locator("[data-process-media]")).toHaveCSS(
        "border-radius",
        "0px",
      );
      await expect(row.locator("[data-process-icon] svg")).toHaveCount(1);
      await expect(row.locator("[data-process-number]")).toHaveAttribute(
        "aria-label",
        `Step ${String(index + 1).padStart(2, "0")}`,
      );
      await expect(row.locator("[data-process-node]")).toHaveCount(2);
    }

    await page.evaluate(() => {
      document.querySelector("#how-i-work")?.scrollIntoView({ block: "start" });
    });

    if ((page.viewportSize()?.width ?? 0) >= 1024) {
      const rail = section.locator("[data-rail]");
      await expect(rail).toBeVisible();
      const railBox = await rail.boundingBox();
      expect(railBox).not.toBeNull();
      expect(railBox!.x).toBeLessThan((page.viewportSize()?.width ?? 0) / 2);

      const firstMedia = await steps
        .nth(0)
        .locator("[data-process-media]")
        .boundingBox();
      const firstContent = await steps
        .nth(0)
        .locator("[data-process-content]")
        .boundingBox();
      const secondMedia = await steps
        .nth(1)
        .locator("[data-process-media]")
        .boundingBox();
      const secondContent = await steps
        .nth(1)
        .locator("[data-process-content]")
        .boundingBox();

      expect(firstMedia).not.toBeNull();
      expect(firstContent).not.toBeNull();
      expect(secondMedia).not.toBeNull();
      expect(secondContent).not.toBeNull();
      expect(firstMedia!.x).toBeGreaterThan(firstContent!.x);
      expect(secondMedia!.x).toBeLessThan(secondContent!.x);
      await expect(
        section.locator("[data-process-desktop-track]").first(),
      ).toHaveCSS("width", "6px");
      await expect(
        section.locator("[data-process-horizontal-track]").last(),
      ).toBeVisible();
      await expect(
        steps.last().locator("[data-process-horizontal-track]"),
      ).toHaveCount(0);
      await expect(section.locator("[data-process-mobile-track]")).toBeHidden();
    } else {
      await expect(
        section.locator("[data-process-mobile-track]"),
      ).toBeVisible();
      await expect(
        section.locator("[data-process-desktop-track]").first(),
      ).toBeHidden();
      await expect(section.locator("[data-process-mobile-track]")).toHaveCSS(
        "width",
        "4px",
      );
      const hasOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth,
      );
      expect(hasOverflow).toBe(false);
    }
  });

  test("reveals the process heading before the animated steps", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/");
    await expect(page.locator("[data-curtain-content]")).toBeHidden({
      timeout: 15_000,
    });

    const heading = page.locator("[data-process-heading]");
    expect(await opacityOf(heading)).toBeLessThan(0.05);
    expect(await translateY(heading)).toBeGreaterThan(90);

    await heading.evaluate((element) =>
      element.scrollIntoView({ block: "center" }),
    );

    await expect.poll(() => opacityOf(heading)).toBeGreaterThan(0.99);
    await expect.poll(() => translateY(heading)).toBeGreaterThanOrEqual(-0.5);
    await expect.poll(() => translateY(heading)).toBeLessThanOrEqual(0.5);
  });

  test("shows the missing section reveals immediately with reduced motion", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page.locator("[data-curtain-content]")).toBeHidden({
      timeout: 15_000,
    });

    const targets = page.locator(
      "[data-process-heading], [data-contact-reveal]",
    );
    await expect(targets).toHaveCount(3);

    for (let index = 0; index < (await targets.count()); index += 1) {
      const target = targets.nth(index);
      expect(await opacityOf(target)).toBeCloseTo(1, 2);
      expect(await translateY(target)).toBeCloseTo(0, 1);
    }
  });

  test("reveals each step and reverses its progress path on scroll", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/");
    await expect(page.locator("[data-curtain-content]")).toBeHidden({
      timeout: 15_000,
    });

    const step = page.locator("[data-process-step]").nth(1);
    const positions = await step.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return {
        top: rect.top + window.scrollY,
        bottom: rect.bottom + window.scrollY,
      };
    });
    const viewportHeight = page.viewportSize()?.height ?? 900;
    const start = positions.top - viewportHeight * 0.78;
    const end = positions.bottom - viewportHeight * 0.42;
    const progressFill = step.locator(
      (page.viewportSize()?.width ?? 0) >= 810
        ? "[data-process-vertical-fill]"
        : "[data-process-mobile-fill]",
    );
    const scaleY = () =>
      progressFill.evaluate(
        (element) =>
          new DOMMatrixReadOnly(getComputedStyle(element).transform).d,
      );
    const numberY = () =>
      step
        .locator("[data-process-number-strip]")
        .evaluate(
          (element) =>
            new DOMMatrixReadOnly(getComputedStyle(element).transform).f,
        );
    const nodeDot = step.locator("[data-process-node-fill]").first();
    const nodeDotOpacity = () =>
      nodeDot.evaluate((element) => Number(getComputedStyle(element).opacity));
    const nodeDotScale = () =>
      nodeDot.evaluate(
        (element) =>
          new DOMMatrixReadOnly(getComputedStyle(element).transform).a,
      );

    await page.evaluate((y) => window.scrollTo(0, y), end + 80);

    await expect
      .poll(() =>
        step
          .locator("[data-process-media]")
          .evaluate((element) => getComputedStyle(element).opacity),
      )
      .toBe("1");
    await expect.poll(() => scaleY()).toBeGreaterThan(0.9);
    if ((page.viewportSize()?.width ?? 0) >= 810) {
      await expect.poll(() => nodeDotOpacity()).toBeGreaterThan(0.9);
      await expect.poll(() => nodeDotScale()).toBeGreaterThan(0.9);
    }
    const fullNumberY = await numberY();

    if ((page.viewportSize()?.width ?? 0) < 810) {
      await page.evaluate(
        (y) => window.scrollTo(0, y),
        start + (end - start) * 0.45,
      );
      await expect.poll(() => scaleY()).toBeGreaterThan(0.9);
      await expect.poll(() => numberY()).toBe(fullNumberY);

      await page.evaluate((y) => window.scrollTo(0, y), start - 80);
      await expect.poll(() => scaleY()).toBeGreaterThan(0.9);
      await expect.poll(() => numberY()).toBe(fullNumberY);
      return;
    }

    await page.evaluate(
      (y) => window.scrollTo(0, y),
      start + (end - start) * 0.45,
    );
    await expect.poll(() => scaleY()).toBeLessThan(0.85);
    await expect.poll(() => scaleY()).toBeGreaterThan(0.1);
    await expect.poll(() => numberY()).toBeGreaterThan(fullNumberY);

    await page.evaluate((y) => window.scrollTo(0, y), start - 80);
    await expect.poll(() => scaleY()).toBeLessThan(0.1);
    await expect.poll(() => numberY()).toBeGreaterThan(-1);
  });

  test("uses the selected-project image hover treatment", async ({ page }) => {
    test.skip(
      (page.viewportSize()?.width ?? 0) < 810,
      "Pointer-follow image hover is desktop-only",
    );
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/");
    await expect(page.locator("[data-curtain-content]")).toBeHidden({
      timeout: 15_000,
    });

    const media = page.locator("[data-process-media]").first();
    const image = media.locator("img");
    await media.scrollIntoViewIfNeeded();

    const scaleOf = () =>
      image.evaluate((element) => {
        const matrix = new DOMMatrixReadOnly(
          getComputedStyle(element).transform,
        );
        return matrix.a;
      });

    await media.hover();
    await expect.poll(() => scaleOf()).toBeGreaterThan(1.04);
    await expect
      .poll(() => image.evaluate((element) => getComputedStyle(element).filter))
      .toBe("grayscale(0)");

    await page.mouse.move(0, 0);
    await expect.poll(() => scaleOf()).toBeLessThan(1.02);
  });
});

test.describe("about", () => {
  const waitForPage = async (page: import("@playwright/test").Page) => {
    await expect(page.locator("[data-curtain-content]")).toBeHidden({
      timeout: 15_000,
    });
  };

  test("renders manifesto, stats, and socials without a title or rail", async ({
    page,
  }) => {
    await page.goto("/");

    const section = page.locator("#about");
    await expect(section).toBeAttached();
    await expect(section).toHaveAttribute("aria-label", "About");

    await expect(section.locator("h2")).toHaveCount(0);
    await expect(section.locator("[data-rail]")).toHaveCount(0);

    const paragraph = section.locator("[data-stagger-text]");
    await expect(paragraph).toHaveCount(1);
    await expect(paragraph).toContainText(about.manifesto);
    await expect(paragraph.locator("[data-stagger-unit]")).toHaveCount(
      about.manifesto.split(/\s+/).filter(Boolean).length,
    );

    const statCells = section.locator("[data-about-stat]");
    await expect(statCells).toHaveCount(stats.length);
    for (const stat of stats) {
      await expect(
        statCells.filter({ hasText: stat.label }).first(),
      ).toContainText(stat.label);
    }

    const socialRows = section.locator("[data-social-row-inner]");
    await expect(socialRows).toHaveCount(socials.length);
    for (const social of socials) {
      await expect(
        socialRows.filter({ hasText: social.label }).first(),
      ).toBeVisible();
    }
  });

  test("fits a statement frame on desktop", async ({ page }) => {
    await page.goto("/");
    await waitForPage(page);

    await page.evaluate(() => document.fonts.ready);

    const section = page.locator("#about");
    await expect(section).toBeAttached();

    const viewport = page.viewportSize() ?? { width: 0, height: 0 };
    if (viewport.width < 1024) return;

    const box = await section.boundingBox();
    expect(box).not.toBeNull();
    expect(
      box!.height,
      "about section stays within 80vh on desktop",
    ).toBeLessThanOrEqual(viewport.height * 0.8 + 2);
  });

  test("menu About link scrolls to the about section", async ({ page }) => {
    await page.goto("/");
    await waitForPage(page);

    await page.locator("[data-hero-menu-toggle]").click();
    const link = page
      .getByRole("navigation", { name: "Menu" })
      .getByRole("link", { name: "About" });
    await expect(link).toBeVisible();
    await link.click();

    await expect(page.locator("#staggered-menu-panel")).toBeHidden();
    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBeGreaterThan(0);
    await expect
      .poll(() =>
        page.locator("#about").evaluate((el) => el.getBoundingClientRect().top),
      )
      .toBeLessThanOrEqual(page.viewportSize()?.height ?? 900);
    await expect(page.locator("#about")).toBeInViewport();
  });

  test("odometer rolls from zero on scroll entry", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/");
    await waitForPage(page);

    await page.evaluate(() => {
      document
        .querySelector("[data-about-stats]")
        ?.scrollIntoView({ block: "center" });
    });

    const firstStrip = page.locator("#about [data-odometer-strip]").first();
    await expect
      .poll(() => stripY(firstStrip), "odometer catches the roll mid-flight")
      .toBeGreaterThan((await stripTarget(firstStrip)) + 1);

    const strips = page.locator("#about [data-odometer-strip]");
    const count = await strips.count();
    for (let index = 0; index < count; index += 1) {
      const strip = strips.nth(index);
      const digit = Number(await strip.getAttribute("data-digit"));
      await expect
        .poll(() => visibleDigit(strip), `digit column ${index} settles`)
        .toBe(digit);
    }

    await expect(page.locator("[data-stat-label]").first()).toHaveCSS(
      "opacity",
      "1",
    );
  });

  test("manifesto words stagger reveal on scroll", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/");
    await waitForPage(page);

    await page.evaluate(() => {
      document
        .querySelector("[data-about-manifesto]")
        ?.scrollIntoView({ block: "center" });
    });

    const words = page.locator("[data-about-manifesto] [data-stagger-unit]");
    await expect(words).toHaveCount(
      about.manifesto.split(/\s+/).filter(Boolean).length,
    );

    await expect
      .poll(
        () =>
          words.first().evaluate((el) => {
            const matrix = getComputedStyle(el as HTMLElement).transform;
            if (!matrix || matrix === "none") return 0;
            return new DOMMatrixReadOnly(matrix).m42;
          }),
        "manifesto words catch the reveal mid-flight",
      )
      .toBeGreaterThan(0);

    await expect
      .poll(
        () =>
          words.evaluateAll((units) =>
            Math.max(
              ...units.map((el) => {
                const matrix = getComputedStyle(el as HTMLElement).transform;
                if (!matrix || matrix === "none") return 0;
                return new DOMMatrixReadOnly(matrix).m42;
              }),
            ),
          ),
        "manifesto words settle into place",
      )
      .toBe(0);
  });

  test("manifesto is justified and no word is cut off by its mask", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/");
    await waitForPage(page);

    await page.evaluate(() => {
      document
        .querySelector("[data-about-manifesto]")
        ?.scrollIntoView({ block: "center" });
    });

    const paragraph = page.locator(
      "[data-about-manifesto] [data-stagger-text]",
    );
    await expect(paragraph).toHaveCSS("text-align", "justify");

    const words = page.locator("[data-about-manifesto] [data-stagger-unit]");
    await expect
      .poll(() =>
        words.evaluateAll((units) =>
          Math.max(
            ...units.map((el) => {
              const matrix = getComputedStyle(el as HTMLElement).transform;
              if (!matrix || matrix === "none") return 0;
              return new DOMMatrixReadOnly(matrix).m42;
            }),
          ),
        ),
      )
      .toBe(0);

    const clipped = await words.evaluateAll(
      (units) =>
        units.filter((el) => {
          const unit = el as HTMLElement;
          const mask = unit.parentElement;
          if (!mask) return false;
          return (
            unit.getBoundingClientRect().bottom >
            mask.getBoundingClientRect().bottom + 0.5
          );
        }).length,
    );
    expect(clipped, "no manifesto word is cut off by its mask").toBe(0);
  });

  test("social rows reveal on scroll and link only when a href exists", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/");
    await waitForPage(page);

    const rows = page.locator("[data-social-rows] [data-social-row-inner]");
    await expect(rows).toHaveCount(socials.length);

    await page.evaluate(() => {
      document
        .querySelector("[data-social-rows]")
        ?.scrollIntoView({ block: "center" });
    });

    for (let index = 0; index < (await rows.count()); index += 1) {
      const row = rows.nth(index);
      await expect
        .poll(() => stripY(row), `social row ${index} slides into place`)
        .toBe(0);
    }

    for (const social of socials) {
      const row = rows.filter({ hasText: social.label }).first();
      await expect(row).toBeVisible();
      await expect(row).toContainText(social.label);

      const link = page.getByRole("link", { name: social.label });
      if (social.href) {
        await expect(link).toHaveAttribute("href", social.href);
      } else {
        await expect(link).toHaveCount(0);
      }
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
      const headingBox = await heading.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        return { x: rect.x, width: rect.width };
      });
      fitInViewport(headingBox, width);

      const actions = page.locator("[data-hero-action]");
      for (const action of await actions.all()) {
        await expect(action).toBeVisible();
        const box = await action.evaluate((element) => {
          const rect = element.getBoundingClientRect();
          return { x: rect.x, width: rect.width };
        });
        fitInViewport(box!, width);
      }

      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
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

      // Wait for the app to mount (curtain dismissed) so the toggle click
      // always lands on the hydrated React handler.
      await expect(page.locator("[data-curtain-content]")).toBeHidden({
        timeout: 15_000,
      });

      const toggle = page.locator("[data-hero-menu-toggle]");
      await toggle.click();

      const panel = page.locator("#staggered-menu-panel");
      await expect(panel).toBeVisible();
      await expect
        .poll(() =>
          panel.evaluate((element) => getComputedStyle(element).transform),
        )
        .toMatch(/^(none|matrix\(1, 0, 0, 1, 0, 0\))$/);
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
        panelBox!.x + panelBox!.width + 1,
      );
    }
  });

  test("work section fits without horizontal overflow at 320px", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto("/");

    // Wait for the app to mount so the section reveal is positioned before
    // scrolling to it.
    await expect(page.locator("[data-curtain-content]")).toBeHidden({
      timeout: 15_000,
    });

    const section = page.locator("#work");
    await expect(section).toBeAttached();
    await page.evaluate(() => {
      document.querySelector("#work")?.scrollIntoView({ block: "start" });
    });

    const heading = page.locator("#work-heading");
    await expect(heading).toBeVisible();
    const headingBox = await heading.boundingBox();
    expect(headingBox).not.toBeNull();
    fitInViewport(headingBox!, 320);

    const lineTops = await heading
      .locator(":scope > span")
      .evaluateAll((spans) =>
        spans.map((span) => Math.round(span.getBoundingClientRect().top)),
      );
    expect(new Set(lineTops).size).toBe(1);

    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(320);

    const rows = page.locator("[data-work-row]");
    await expect(rows).toHaveCount(projects.length);

    for (const project of projects) {
      const row = rows.filter({ hasText: project.title }).first();
      await expect(row).toBeVisible();
      const box = await row.boundingBox();
      expect(box, project.title).not.toBeNull();
      fitInViewport(box!, 320);
      await expect(row.locator("[data-work-index]")).toBeHidden();
      await expect(row.locator("[data-work-meta]")).toContainText(project.year);
    }
  });

  test("about section fits without horizontal overflow at 320px", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto("/");
    await expect(page.locator("[data-curtain-content]")).toBeHidden({
      timeout: 15_000,
    });

    const section = page.locator("#about");
    await expect(section).toBeAttached();
    await page.evaluate(() => {
      document.querySelector("#about")?.scrollIntoView({ block: "start" });
    });

    const paragraphs = section.locator("[data-stagger-text]");
    for (let index = 0; index < (await paragraphs.count()); index += 1) {
      const box = await paragraphs.nth(index).boundingBox();
      expect(box, `manifesto paragraph ${index}`).not.toBeNull();
      fitInViewport(box!, 320);
    }

    const statCells = section.locator("[data-about-stat]");
    for (let index = 0; index < (await statCells.count()); index += 1) {
      const box = await statCells.nth(index).boundingBox();
      expect(box, `stat cell ${index}`).not.toBeNull();
      fitInViewport(box!, 320);
    }

    const socialRows = section.locator("[data-social-row-inner]");
    for (let index = 0; index < (await socialRows.count()); index += 1) {
      const box = await socialRows.nth(index).boundingBox();
      expect(box, `social row ${index}`).not.toBeNull();
      fitInViewport(box!, 320);
    }

    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(320);
  });
});

test.describe("scroll-to-top", () => {
  test("is hidden at the top of the page", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("[data-curtain-content]")).toBeHidden({
      timeout: 15_000,
    });
    await page.evaluate(() => window.scrollTo(0, 0));

    const button = page.locator("[data-scroll-to-top]");
    await expect(button).toBeHidden();
  });

  test("appears after scrolling past 20% of the viewport", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("[data-curtain-content]")).toBeHidden({
      timeout: 15_000,
    });

    const button = page.locator("[data-scroll-to-top]");

    // Scroll to just below 20% threshold
    const threshold = await page.evaluate(() => window.innerHeight * 0.2 + 10);
    await page.evaluate((t) => window.scrollTo(0, t), threshold);
    await expect(button).toBeVisible();
  });

  test("hides when scrolling back to the top", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("[data-curtain-content]")).toBeHidden({
      timeout: 15_000,
    });

    const button = page.locator("[data-scroll-to-top]");

    // Scroll down to show button
    const threshold = await page.evaluate(() => window.innerHeight * 0.2 + 10);
    await page.evaluate((t) => window.scrollTo(0, t), threshold);
    await expect(button).toBeVisible();

    // Scroll back to top
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(button).toBeHidden();
  });

  test("scroll progress ring reflects scroll position", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/");
    await expect(page.locator("[data-curtain-content]")).toBeHidden({
      timeout: 15_000,
    });

    const button = page.locator("[data-scroll-to-top]");
    const threshold = await page.evaluate(() => window.innerHeight * 0.2 + 10);
    await page.evaluate((t) => window.scrollTo(0, t), threshold);
    await expect(button).toBeVisible();

    const getOffset = () =>
      page.evaluate(() => {
        const circle = document.querySelector<SVGCircleElement>(
          "[data-scroll-to-top] .stt-progress",
        );
        if (!circle) return "0";
        return circle.getAttribute("stroke-dashoffset") ?? "0";
      });

    // At ~20% scroll, progress should be small
    const offsetAt20 = await getOffset();

    // Scroll to bottom and wait for Lenis to finish
    await page.evaluate(() =>
      window.scrollTo(0, document.documentElement.scrollHeight),
    );
    await page.waitForFunction(
      () => {
        const y = window.scrollY;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        return max <= 0 || Math.abs(y - max) < 10;
      },
      { timeout: 5_000 },
    );
    const offsetAtBottom = await getOffset();

    // Progress should increase (offset decreases) as we scroll down
    expect(Number(offsetAtBottom)).toBeLessThan(Number(offsetAt20));
  });

  test("clicking scrolls to top with curtain wipe animation", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/");
    await expect(page.locator("[data-curtain-content]")).toBeHidden({
      timeout: 15_000,
    });

    const button = page.locator("[data-scroll-to-top]");

    // Scroll down to show button
    await page.evaluate(() =>
      window.scrollTo(0, document.documentElement.scrollHeight / 2),
    );
    await expect(button).toBeVisible();

    // Click the button
    await button.click();

    // Curtain panels should appear briefly
    const curtain = page.locator(".stt-curtain");
    await expect(curtain).toBeVisible({ timeout: 2_000 });

    // After animation completes, curtain should be hidden and scroll at top
    await expect(curtain).toBeHidden({ timeout: 5_000 });
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  });

  test("is hidden while the staggered menu is open", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("[data-curtain-content]")).toBeHidden({
      timeout: 15_000,
    });

    const button = page.locator("[data-scroll-to-top]");

    // Scroll down to show button
    await page.evaluate(() =>
      window.scrollTo(0, document.documentElement.scrollHeight / 2),
    );
    await expect(button).toBeVisible();

    // Open menu
    await page.locator("[data-hero-menu-toggle]").click();
    await expect(
      page.getByRole("button", { name: "Close menu" }),
    ).toBeVisible();

    // Button should be hidden
    await expect(button).toBeHidden();

    // Close menu
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: "Open menu" })).toBeVisible();
    // Button should reappear
    await expect(button).toBeVisible();
  });

  test("hidden during preloader", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const button = page.locator("[data-scroll-to-top]");
    await expect(button).toBeHidden();
  });
});

test.describe("navigation wipe", () => {
  const waitForPage = async (page: import("@playwright/test").Page) => {
    await expect(page.locator("[data-curtain-content]")).toBeHidden({
      timeout: 15_000,
    });
  };

  const curtain = (page: import("@playwright/test").Page) =>
    page.locator("[data-wipe-curtain]");

  test("menu link closes the menu and lands on the section without a curtain", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/");
    await waitForPage(page);

    await page.locator("[data-hero-menu-toggle]").click();
    const link = page
      .getByRole("navigation", { name: "Menu" })
      .getByRole("link", { name: navigation[0].label, exact: true });
    await expect(link).toBeVisible();
    await link.click();

    await expect(curtain(page)).toBeHidden({ timeout: 5_000 });

    await expect(page.locator("#staggered-menu-panel")).toBeHidden();
    await expect(page.locator(navigation[0].href)).toBeInViewport();
  });

  test("hero CTA click plays the curtain wipe and lands on the section", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/");
    await waitForPage(page);

    const action = hero.actions[0];
    await page.getByRole("link", { name: action.label }).click();

    await expect(curtain(page)).toBeVisible({ timeout: 2_000 });
    await expect(curtain(page)).toBeHidden({ timeout: 5_000 });

    await expect(page.locator(action.href)).toBeInViewport();
  });

  test("monogram click wipes back to the hero", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/");
    await waitForPage(page);

    await page.evaluate(() =>
      window.scrollTo(0, document.documentElement.scrollHeight / 2),
    );
    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBeGreaterThan(0);

    await page.locator("[data-hero-mono]").click();

    await expect(curtain(page)).toBeVisible({ timeout: 2_000 });
    await expect(curtain(page)).toBeHidden({ timeout: 5_000 });
    await expect(page.locator("#hero-heading")).toBeInViewport();
  });
});
