import { expect, test } from "@playwright/test";

import {
  about,
  hero,
  navigation,
  profile,
  projects,
  socials,
  stats,
  work,
} from "../src/lib/data";

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

  test("shows the odometer counter during the preloader", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const odometer = page.locator("[data-odometer]");
    await expect(odometer).toBeVisible();
    await expect(odometer.locator("[data-odometer-wheel]")).toHaveCount(3);

    await expect(odometer).toBeHidden({ timeout: 10_000 });
  });

  test("restores scrolling after the preloader finishes", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("[data-curtain-content]")).toBeHidden({
      timeout: 15_000,
    });
    await expect
      .poll(() =>
        page.evaluate(() =>
          document.documentElement.classList.contains("lenis-stopped")
        )
      )
      .toBe(false);

    const before = await page.evaluate(() => window.scrollY);
    await page.mouse.wheel(0, 600);
    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBeGreaterThan(before);
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
      container.evaluate((element) => Number(getComputedStyle(element).opacity));
    const translateY = () =>
      container.evaluate((element) => {
        const matrix = getComputedStyle(element).transform.match(/matrix[^)]*\)/);
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

    await page.evaluate(() =>
      window.scrollTo(0, document.documentElement.scrollHeight / 2)
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
      window.scrollTo(0, document.documentElement.scrollHeight)
    );
    await expect
      .poll(opacity, "arrow is gone at the bottom of the page")
      .toBeLessThan(0.05);
    await expect
      .poll(translateY, "arrow is slid up at the bottom of the page")
      .toBeLessThan(-40);
  });

  test("keeps the scroll arrow at full length with reduced motion", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page.locator("[data-curtain-content]")).toBeHidden({
      timeout: 15_000,
    });

    const arrow = page.locator("[data-scroll-arrow]");
    const container = page.locator("[data-hero-scroll]");
    await expect(arrow).toBeVisible();
    const arrowHeight = () =>
      arrow.evaluate((element) => element.getBoundingClientRect().height);
    const opacity = () =>
      container.evaluate((element) => Number(getComputedStyle(element).opacity));

    const initial = await arrowHeight();
    expect(initial).toBeGreaterThan(20);

    await page.evaluate(() =>
      window.scrollTo(0, document.documentElement.scrollHeight)
    );
    await expect
      .poll(arrowHeight, "arrow stays full length with reduced motion")
      .toBeGreaterThan(initial - 1);
    await expect
      .poll(opacity, "arrow stays fully visible with reduced motion")
      .toBeGreaterThan(0.9);
  });

  test("renders the navbar with the menu toggle and monogram", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(
      page.getByRole("link", { name: `${profile.name}, home` })
    ).toBeVisible();

    await expect(
      page.getByRole("link", { name: `${profile.name}, home` })
    ).toHaveText(profile.brand);

    const toggle = page.locator("[data-hero-menu-toggle]");
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(toggle).toHaveAttribute("aria-controls", "staggered-menu-panel");

    const visibleToggleLabel = () =>
      toggle
        .locator(".smg-toggle-lines")
        .evaluate((el) => {
          const html = el as HTMLElement;
          const lines = Array.from(html.querySelectorAll(".smg-toggle-line"));
          const lineHeight = lines[0]?.getBoundingClientRect().height || 1;
          const match = window.getComputedStyle(html).transform.match(/[-.\d]+/g);
          const translateY = match && match.length >= 6 ? Number(match[5]) : 0;
          const index = Math.min(
            lines.length - 1,
            Math.max(0, Math.round(-translateY / lineHeight))
          );
          return (lines[index] as HTMLElement)?.textContent ?? "";
        });

    await expect
      .poll(visibleToggleLabel, "toggle reads Menu before any interaction")
      .toBe("Menu");

    await expect(page.locator("#staggered-menu-panel")).toBeHidden();
  });

  test("toggle markup is deterministic on load with reduced motion", async ({
    page,
  }) => {
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
              Math.max(0, Math.round(-translateY / lineHeight))
            );
            return lines[index]?.textContent ?? "";
          }),
        "toggle settles on Menu under reduced motion"
      )
      .toBe("Menu");

    await expect
      .poll(
        () => hydrationErrors.length,
        "no hydration mismatch on load under reduced motion"
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

  test("navbar background fades in after the scroll threshold as a sharp full-bleed frosted bar", async ({
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
    await expect.poll(opacity, "background fades to full opacity").toBeCloseTo(1, 1);

    // Bold & sharp: edge-to-edge, square corners, no border, blur.
    const viewport = page.viewportSize();
    const box = await bar.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeCloseTo(0, 0);
    expect(box!.x + box!.width).toBeCloseTo(viewport!.width, 0);
    const radius = await bar.evaluate(
      (element) => Number.parseFloat(getComputedStyle(element).borderRadius)
    );
    expect(radius).toBeLessThanOrEqual(1);
    expect(
      await bar.evaluate((element) => getComputedStyle(element).borderBottomWidth)
    ).toBe("0px");

    const backdropFilter = () =>
      bar.evaluate((element) => getComputedStyle(element).backdropFilter);
    await expect
      .poll(backdropFilter, "bar uses a GPU backdrop blur (no SVG displacement)")
      .toContain("blur(");
    const filterValue = await bar.evaluate(
      (element) => getComputedStyle(element).backdropFilter
    );
    expect(filterValue, "no SVG displacement filter").not.toContain("url(");

    // Content stays on top and interactive.
    await expect(
      page.getByRole("link", { name: `${profile.name}, home` })
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
    await expect.poll(opacity, "bar fades in once the hero leaves view").toBeCloseTo(1, 1);

    await page.evaluate(() => window.scrollTo(0, 0));
    await expect
      .poll(opacity, "bar fades back out as the hero returns to view")
      .toBe(0);
  });

  test("navbar background appears instantly with reduced motion", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page.locator("[data-curtain-content]")).toBeHidden({
      timeout: 15_000,
    });

    await page.evaluate(() => window.scrollTo(0, 400));

    const bar = page.locator("[data-navbar-bg]");
    await expect(bar).toBeVisible();
    const opacity = () =>
      bar.evaluate((element) => Number(getComputedStyle(element).opacity));
    await expect.poll(opacity, "bar is fully opaque, no fade").toBe(1);
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

    await expect(
      panel.getByRole("link", { name: navigation[0].label }),
      "first nav link appears quickly after opening the menu"
    ).toBeVisible({ timeout: 1_500 });

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

  test("menu links are split into masked character pairs", async ({ page }) => {
    await page.goto("/");
    await page.locator("[data-hero-menu-toggle]").click();
    const panel = page.locator("#staggered-menu-panel");
    await expect(panel).toBeVisible();

    await expect(panel.locator("[data-menu-item]")).toHaveCount(
      navigation.length
    );

    for (const item of navigation) {
      const link = panel.getByRole("link", { name: item.label });
      const masks = link.locator(".smg-char-mask");
      await expect(
        masks,
        `${item.label} is split into ${item.label.length} character masks`
      ).toHaveCount(item.label.length);

      const rest = await masks.locator(".smg-char-a").allTextContents();
      const clone = await masks.locator(".smg-char-b").allTextContents();
      expect(rest.join(""), "resting copy spells the label").toBe(item.label);
      expect(clone.join(""), "duplicate copy spells the label").toBe(item.label);
      await expect(masks.locator(".smg-char-b").first()).toHaveAttribute(
        "aria-hidden",
        "true"
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
          .evaluate((el) => getComputedStyle(el).transform)
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
        "duplicate rolls in to fill the mask"
      )
      .toBe("matrix(1, 0, 0, 1, 0, 0)");
  });

  test("menu numbers sit beside the labels and rise into view on open", async ({
    page,
  }) => {
    await page.goto("/");
    await page.locator("[data-hero-menu-toggle]").click();
    const panel = page.locator("#staggered-menu-panel");
    await expect(panel).toBeVisible();

    const link = panel.getByRole("link", { name: navigation[0].label });
    await expect(link).toBeVisible({ timeout: 2_000 });

    const numberRise = () =>
      link.evaluate((el) =>
        getComputedStyle(el).getPropertyValue("--sm-num-rise").trim()
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
      "number anchors to the label's right edge"
    ).toBeLessThan(1);
    expect(numberStyle.opacity, "number is fully visible after the reveal").toBe(
      "1"
    );

    const labelFontSize = await link
      .locator("[data-menu-item-label]")
      .evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    expect(
      numberStyle.fontSize,
      "number scales with but stays smaller than the label"
    ).toBeLessThan(labelFontSize);
  });

  test("menu numbers scale up and fill solid on hover", async ({ page }) => {
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
          getComputedStyle(el).getPropertyValue("--sm-num-rise").trim()
        )
      )
      .toBe("0%");

    const numberScale = () =>
      link.evaluate((el) =>
        parseFloat(getComputedStyle(el).getPropertyValue("--sm-num-scale"))
      );
    const numberFill = () =>
      link.evaluate((el) =>
        getComputedStyle(el, "::before").getPropertyValue(
          "-webkit-text-fill-color"
        )
      );

    await expect.poll(numberScale, "number rests at scale 1").toBe(1);
    await expect
      .poll(numberFill, "number is outlined before hover")
      .toBe("rgba(0, 0, 0, 0)");

    await link.hover();

    await expect.poll(numberScale, "number grows on hover").toBe(1.3);
    await expect
      .poll(numberFill, "number fills solid on hover")
      .not.toBe("rgba(0, 0, 0, 0)");

    await page.mouse.move(0, 0);
    await expect
      .poll(numberScale, "number returns to rest on leave")
      .toBe(1);
  });

  test("menu links do not animate on hover with reduced motion", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");

    // Wait for the app to mount (curtain dismissed) so the toggle click
    // always lands on the hydrated React handler.
    await expect(page.locator("[data-curtain-content]")).toBeHidden({
      timeout: 15_000,
    });

    await page.locator("[data-hero-menu-toggle]").click();
    const panel = page.locator("#staggered-menu-panel");
    await expect(panel).toBeVisible();

    const link = panel.getByRole("link", { name: navigation[0].label });
    await expect(link).toBeVisible({ timeout: 2_000 });

    const rest = link.locator(".smg-char-a").first();
    const before = await rest.evaluate((el) => getComputedStyle(el).transform);

    await link.hover();
    await page.waitForTimeout(400);

    const after = await rest.evaluate((el) => getComputedStyle(el).transform);
    expect(after, "hover leaves characters untouched").toBe(before);

    const numberScale = await link.evaluate((el) =>
      getComputedStyle(el).getPropertyValue("--sm-num-scale").trim()
    );
    expect(numberScale, "hover leaves the number at rest scale").toBe("1");
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

    const railLabel = page.locator("[data-rail-label]");
    await expect(railLabel).toHaveText(work.index);
    if ((page.viewportSize()?.width ?? 0) >= 1024) {
      await expect(railLabel).toBeVisible();
    } else {
      await expect(railLabel).toBeHidden();
    }

    const rows = page.locator("[data-work-row]");
    await expect(rows).toHaveCount(projects.length);
    await expect(rows.first()).toHaveCSS("background-color", "rgb(255, 255, 255)");

    for (const project of projects) {
      const row = rows.filter({ hasText: project.title }).first();
      await expect(row).toBeVisible();
      await expect(row).toContainText(project.year);
      await expect(row).toContainText(project.description);
      await expect(row).toContainText(project.stack[0]);

      const techStack = row.locator("[data-tech-stack]");
      await expect(techStack).toHaveAttribute(
        "aria-label",
        `${project.title} technology stack`
      );
      await expect(techStack.locator("[data-tech-avatar]")).toHaveCount(
        project.stack.length
      );

      for (const technology of project.stack) {
        await expect(
          techStack.locator(`[data-tech-avatar][aria-label="${technology}"]`)
        ).toBeAttached();
      }

      const link = page.getByRole("link", { name: project.title });
      if (project.href) {
        await expect(link).toHaveAttribute("href", project.href);
      } else {
        await expect(link).toHaveCount(0);
      }
    }
  });

  test("work rail appears with the cards and fades away when the section ends", async ({
    page,
  }) => {
    await page.goto("/");

    const rail = page.locator("[data-rail]");
    const viewportH = page.viewportSize()?.height ?? 0;
    const viewportW = page.viewportSize()?.width ?? 0;
    if ((page.viewportSize()?.width ?? 0) < 1024) {
      await expect(rail).toBeHidden();
      return;
    }

    const opacityOf = () =>
      rail.evaluate(
        (element) => Number.parseFloat(getComputedStyle(element).opacity)
      );

    await page.evaluate(() => window.scrollTo(0, 0));
    await expect.poll(opacityOf, "rail hidden while the hero is on screen").toBe(0);

    const { cardsTopAbs, scrollable } = await page.evaluate(() => {
      const cards = document
        .querySelector("[data-work-cards]")
        ?.getBoundingClientRect();
      return {
        cardsTopAbs: (cards?.top ?? 0) + window.scrollY,
        scrollable: document.documentElement.scrollHeight - window.innerHeight,
      };
    });

    const start = Math.max(0, cardsTopAbs - viewportH / 2 + 30);
    const end = Math.max(start, scrollable - 60);
    const offsets = [
      start,
      Math.round(start + (end - start) * 0.35),
      Math.round(start + (end - start) * 0.7),
      end,
    ];

    for (const offset of offsets) {
      await page.evaluate((y) => window.scrollTo(0, y), offset);
      await expect
        .poll(opacityOf, `rail visible while the cards are in view at scrollY=${offset}`)
        .toBe(1);
      const box = await rail.boundingBox();
      expect(box).not.toBeNull();
      const centerY = box!.y + box!.height / 2;
      expect(
        Math.abs(centerY - viewportH / 2),
        `rail center stays at mid-viewport at scrollY=${offset}`
      ).toBeLessThanOrEqual(15);
      expect(
        box!.x,
        "work rail sits on the right side of the viewport"
      ).toBeGreaterThan(viewportW / 2);
    }

    await page.evaluate((y) => window.scrollTo(0, y), scrollable);
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
      0
    );
    await expect(page.locator("[data-work-underline]")).toHaveCount(0);
  });

  test("shows faded outlined numerals inside the info column and Unsplash images", async ({
    page,
  }) => {
    await page.goto("/");

    const rows = page.locator("[data-work-row]");
    await expect(rows).toHaveCount(projects.length);

    for (const [index, project] of projects.entries()) {
      const row = rows.filter({ hasText: project.title }).first();
      await row.evaluate((element) =>
        element.scrollIntoView({ block: "center" })
      );

      await expect(row).toHaveCSS("border-top-width", "0px");

      const infoBox = await row.locator("[data-work-info]").boundingBox();
      expect(infoBox, project.title).not.toBeNull();

      const numeral = row.locator("[data-work-index]");
      if ((page.viewportSize()?.width ?? 0) >= 1024) {
        await expect(numeral).toBeVisible();
        await expect(numeral).toHaveText(String(index + 1).padStart(2, "0"));
        const numeralBox = await numeral.boundingBox();
        expect(numeralBox, project.title).not.toBeNull();
        expect(
          numeralBox!.x + numeralBox!.width,
          `${project.title}: numeral sits at the top-right corner of the info column`
        ).toBeCloseTo(infoBox!.x + infoBox!.width, 0);
        expect(numeralBox!.y, project.title).toBeCloseTo(infoBox!.y, 0);

        const contentBox = await row.locator("[data-work-content]").boundingBox();
        expect(contentBox, project.title).not.toBeNull();
        expect(
          infoBox!.y + infoBox!.height - (contentBox!.y + contentBox!.height),
          `${project.title}: info content stays bottom-aligned (pb-2 padding only)`
        ).toBeLessThanOrEqual(10);
      } else {
        await expect(numeral).toBeHidden();
      }

      const img = row.locator("[data-work-figure] img");
      await expect(img).toHaveCount(1);
      await expect(img).toHaveAttribute("src", /images\.unsplash\.com/);
      await expect(img).toHaveAttribute(
        "loading",
        index === 0 ? "eager" : "lazy"
      );
    }
  });

  test("keeps technology icons black and reveals every label on hover", async ({
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
        page.evaluate(
          () =>
            getComputedStyle(document.querySelector("[data-work-row]")).opacity
        )
      )
      .toBe("1");

    const stack = page.locator("[data-tech-stack]").first();
    const icons = stack.locator("[data-tech-icon]");
    const initialColors = await icons.evaluateAll((elements) =>
      elements.map((element) => getComputedStyle(element).color)
    );

    expect(new Set(initialColors).size).toBe(1);

    const iconBox = await icons.first().locator("svg").boundingBox();
    expect(iconBox?.width ?? 0).toBeGreaterThan(20);
    expect(iconBox?.width ?? 0).toBeLessThan(25);

    const avatars = stack.locator("[data-tech-avatar]");
    for (let index = 0; index < await avatars.count(); index += 1) {
      const avatar = avatars.nth(index);
      await avatar.hover();
      await expect(avatar.locator("[data-tech-label]")).toBeVisible();
    }
  });
});

test.describe("about", () => {
  const waitForPage = async (page: import("@playwright/test").Page) => {
    await expect(page.locator("[data-curtain-content]")).toBeHidden({
      timeout: 15_000,
    });
  };

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
        (child) =>
          Math.abs(child.getBoundingClientRect().top - containerTop) < 2
      );
    });

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
      about.manifesto.split(/\s+/).filter(Boolean).length
    );

    const statCells = section.locator("[data-about-stat]");
    await expect(statCells).toHaveCount(stats.length);
    for (const stat of stats) {
      await expect(statCells.filter({ hasText: stat.label }).first()).toContainText(
        stat.label
      );
    }

    const socialRows = section.locator("[data-social-row-inner]");
    await expect(socialRows).toHaveCount(socials.length);
    for (const social of socials) {
      await expect(
        socialRows.filter({ hasText: social.label }).first()
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
      "about section stays within 80vh on desktop"
    ).toBeLessThanOrEqual(viewport.height * 0.8 + 2);
  });

  test("menu About link scrolls to the about section", async ({ page }) => {
    await page.goto("/");
    await waitForPage(page);

    await page.locator("[data-hero-menu-toggle]").click();
    const link = page.getByRole("link", { name: "About" });
    await expect(link).toBeVisible();
    await link.click();

    await expect(page.locator("#staggered-menu-panel")).toBeHidden();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
    await expect
      .poll(() =>
        page.locator("#about").evaluate((el) => el.getBoundingClientRect().top)
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

    const firstStrip = page.locator("[data-odometer-strip]").first();
    await expect
      .poll(() => stripY(firstStrip), "odometer catches the roll mid-flight")
      .toBeGreaterThan((await stripTarget(firstStrip)) + 1);

    const strips = page.locator("[data-odometer-strip]");
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
      "1"
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
      about.manifesto.split(/\s+/).filter(Boolean).length
    );

    await expect
      .poll(
        () =>
          words.first().evaluate((el) => {
            const matrix = getComputedStyle(el as HTMLElement).transform;
            if (!matrix || matrix === "none") return 0;
            return new DOMMatrixReadOnly(matrix).m42;
          }),
        "manifesto words catch the reveal mid-flight"
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
              })
            )
          ),
        "manifesto words settle into place"
      )
      .toBe(0);
  });

  test("manifesto is left-aligned and no word is cut off by its mask", async ({
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

    const paragraph = page.locator("[data-about-manifesto] [data-stagger-text]");
    await expect(paragraph).toHaveCSS("text-align", "left");

    const words = page.locator("[data-about-manifesto] [data-stagger-unit]");
    await expect
      .poll(() =>
        words.evaluateAll((units) =>
          Math.max(
            ...units.map((el) => {
              const matrix = getComputedStyle(el as HTMLElement).transform;
              if (!matrix || matrix === "none") return 0;
              return new DOMMatrixReadOnly(matrix).m42;
            })
          )
        )
      )
      .toBe(0);

    const clipped = await words.evaluateAll((units) =>
      units.filter((el) => {
        const unit = el as HTMLElement;
        const mask = unit.parentElement;
        if (!mask) return false;
        return (
          unit.getBoundingClientRect().bottom >
          mask.getBoundingClientRect().bottom + 0.5
        );
      }).length
    );
    expect(clipped, "no manifesto word is cut off by its mask").toBe(0);
  });

  test("reduced motion shows final stats and socials instantly", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await waitForPage(page);

    await page.evaluate(() => {
      document.querySelector("#about")?.scrollIntoView({ block: "start" });
    });

    const strips = page.locator("[data-odometer-strip]");
    const count = await strips.count();
    expect(count).toBeGreaterThan(0);
    for (let index = 0; index < count; index += 1) {
      const strip = strips.nth(index);
      const digit = Number(await strip.getAttribute("data-digit"));
      await expect.poll(() => visibleDigit(strip)).toBe(digit);
    }

    await expect(page.locator("[data-stat-label]").first()).toHaveCSS(
      "opacity",
      "1"
    );
    const socialRow = page.locator("[data-social-row-inner]").first();
    await expect(socialRow).toBeVisible();
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

    for (let index = 0; index < await rows.count(); index += 1) {
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
      await expect.poll(() => heading.boundingBox()).not.toBeNull();
      const headingBox = await heading.boundingBox();
      fitInViewport(headingBox!, width);

      const actions = page.locator("[data-hero-action]");
      for (const action of await actions.all()) {
        await expect.poll(() => action.boundingBox()).not.toBeNull();
        const box = await action.boundingBox();
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

    const lineTops = await heading.locator(":scope > span").evaluateAll((spans) =>
      spans.map((span) => Math.round(span.getBoundingClientRect().top))
    );
    expect(new Set(lineTops).size).toBe(1);

    expect(
      await page.evaluate(() => document.documentElement.scrollWidth)
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
    for (let index = 0; index < await paragraphs.count(); index += 1) {
      const box = await paragraphs.nth(index).boundingBox();
      expect(box, `manifesto paragraph ${index}`).not.toBeNull();
      fitInViewport(box!, 320);
    }

    const statCells = section.locator("[data-about-stat]");
    for (let index = 0; index < await statCells.count(); index += 1) {
      const box = await statCells.nth(index).boundingBox();
      expect(box, `stat cell ${index}`).not.toBeNull();
      fitInViewport(box!, 320);
    }

    const socialRows = section.locator("[data-social-row-inner]");
    for (let index = 0; index < await socialRows.count(); index += 1) {
      const box = await socialRows.nth(index).boundingBox();
      expect(box, `social row ${index}`).not.toBeNull();
      fitInViewport(box!, 320);
    }

    expect(
      await page.evaluate(() => document.documentElement.scrollWidth)
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

  test("appears after scrolling past 20% of the viewport", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator("[data-curtain-content]")).toBeHidden({
      timeout: 15_000,
    });

    const button = page.locator("[data-scroll-to-top]");

    // Scroll to just below 20% threshold
    const threshold = await page.evaluate(
      () => window.innerHeight * 0.2 + 10
    );
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
    const threshold = await page.evaluate(
      () => window.innerHeight * 0.2 + 10
    );
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
    const threshold = await page.evaluate(
      () => window.innerHeight * 0.2 + 10
    );
    await page.evaluate((t) => window.scrollTo(0, t), threshold);
    await expect(button).toBeVisible();

    const getOffset = () =>
      page.evaluate(() => {
        const circle = document.querySelector<SVGCircleElement>(
          "[data-scroll-to-top] .stt-progress"
        );
        if (!circle) return "0";
        return circle.getAttribute("stroke-dashoffset") ?? "0";
      });

    // At ~20% scroll, progress should be small
    const offsetAt20 = await getOffset();

    // Scroll to bottom and wait for Lenis to finish
    await page.evaluate(() =>
      window.scrollTo(0, document.documentElement.scrollHeight)
    );
    await page.waitForFunction(
      () => {
        const y = window.scrollY;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        return max <= 0 || Math.abs(y - max) < 10;
      },
      { timeout: 5_000 }
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
      window.scrollTo(0, document.documentElement.scrollHeight / 2)
    );
    await expect(button).toBeVisible();

    // Click the button
    await button.click();

    // Curtain panels should appear briefly
    const curtain = page.locator(".stt-curtain");
    await expect(curtain).toBeVisible({ timeout: 2_000 });

    // After animation completes, curtain should be hidden and scroll at top
    await expect(curtain).toBeHidden({ timeout: 5_000 });
    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBe(0);
  });

  test("is hidden while the staggered menu is open", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("[data-curtain-content]")).toBeHidden({
      timeout: 15_000,
    });

    const button = page.locator("[data-scroll-to-top]");

    // Scroll down to show button
    await page.evaluate(() =>
      window.scrollTo(0, document.documentElement.scrollHeight / 2)
    );
    await expect(button).toBeVisible();

    // Open menu
    await page.locator("[data-hero-menu-toggle]").click();
    await expect(
      page.getByRole("button", { name: "Close menu" })
    ).toBeVisible();

    // Button should be hidden
    await expect(button).toBeHidden();

    // Close menu
    await page.keyboard.press("Escape");
    await expect(
      page.getByRole("button", { name: "Open menu" })
    ).toBeVisible();
    // Button should reappear
    await expect(button).toBeVisible();
  });

  test("hidden during preloader", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const button = page.locator("[data-scroll-to-top]");
    await expect(button).toBeHidden();
  });

  test("works with reduced motion (instant scroll, no curtain)", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page.locator("[data-curtain-content]")).toBeHidden({
      timeout: 15_000,
    });

    const button = page.locator("[data-scroll-to-top]");

    // Scroll down
    await page.evaluate(() =>
      window.scrollTo(0, document.documentElement.scrollHeight / 2)
    );
    await expect(button).toBeVisible();

    // Click — should scroll instantly, no curtain
    await button.click();
    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBe(0);

    // Curtain should not appear
    const curtain = page.locator(".stt-curtain");
    await expect(curtain).toBeHidden();
  });
});
