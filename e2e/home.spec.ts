import { expect, test } from "@playwright/test";

import { hero, navigation, profile, projects, socials, work } from "../src/lib/data";

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

    const row = page.locator("[data-work-row]").first();
    await expect(row).toBeAttached();
    await page.evaluate(() => {
      document
        .querySelector("[data-work-row]")
        ?.scrollIntoView({ block: "center" });
    });

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
      const box = await row.boundingBox();
      expect(box, project.title).not.toBeNull();
      fitInViewport(box!, 320);
      await expect(row.locator("[data-work-index]")).toBeHidden();
      await expect(row.locator("[data-work-meta]")).toContainText(project.year);
    }
  });
});
