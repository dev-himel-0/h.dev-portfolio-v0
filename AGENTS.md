<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project: Himel — Frontend Engineer Portfolio

Premium, awwwards-style portfolio for **Himel** (frontend engineer, 4+ years) to win freelance clients and remote roles.

## Design language

- **Pure black & white.** White background, black text, neutral grays only (oklch tokens already in `globals.css`). No gradients, no accent colors, no emojis, no decorative noise.
- Typography: **General Sans** for display headings, **Montserrat** for body, **Montserrat** for labels/numbers.
- Discipline: generous whitespace, hairline borders (`border-black/10`), large type. Clean and concise — **no AI-slop design or copy**.

## Tech stack

- Next.js 16.2.12 (App Router), React 19, Tailwind v4, shadcn/ui
- GSAP + `@gsap/react` for scroll/menu animations, `motion` for micro-interactions
- `lenis` for smooth scroll, Phosphor icons, tw-animate-css, @base-ui/react
- All animation deps already installed except `lenis` — add it when needed

## Architecture

- `src/components/ui/` — generic animated components (adapted from the reference list below, always recolored to B/W and trimmed for perf)
- `src/components/sections/` — one file per page section (preloader, navbar, hero, work, services, stack, about, contact, site-footer)
- `src/lib/data.ts` — single source of truth for ALL content (projects, services, stack, socials). **Placeholders only until Himel provides real data. NEVER invent his projects, clients, or experience.**
- `src/app/page.tsx` composes the sections

## Reference map

| Reference                  | Component                             | Adaptation notes                                                    |
| -------------------------- | ------------------------------------- | ------------------------------------------------------------------- |
| vengenceui flip-fade-text  | Preloader words                       | Cycling B/W word flip                                               |
| framer curtain-reveal      | Loader→hero wipe, section transitions | Black/white panels                                                  |
| animate-ui flip button     | CTAs                                  | Hand-rolled, two-label flip                                         |
| animate-ui gravity-stars   | Hero background                       | Subtle black dots, mouse-attract                                    |
| reactbits target-cursor    | Custom cursor                         | Desktop-only, lock onto interactive elements                        |
| reactbits glass-surface    | Navbar background                     | B/W-adapted (grayscale map, neutral gradients)                      |
| reactbits magic-bento      | Services grid                         | Black spotlight, hairline borders, mobile-disabled                  |
| reactbits staggered-menu   | Fullscreen nav                        | B/W pre-layers, numbered items, socials                             |
| vengenceui masked-avatars  | Stack section                         | Tech logos in circles, grayscale→color on hover                     |
| vengenceui animated-footer | Site footer                           | Typographic only: char-mask name reveal on scroll (NO canvas/ASCII) |
| framer portrixe            | Content structure                     | Editorial work rows, masked scroll reveals, calm pacing             |

## Motion conventions

- **GSAP is the main animation engine** — all scroll, enter/exit, preloader, menu, and timeline choreography uses GSAP (+ ScrollTrigger). `motion` is reserved for interactive micro-animations only (hover, tap, small state changes) — never use it for reveals or section transitions.
- Lenis smooth scroll + GSAP ScrollTrigger for all reveals
- One reusable `section-reveal` wrapper in `src/components/ui/` — reuse it, do not hand-roll reveals per section
- **Section rail pattern**: every section (except hero) gets one `SectionRail` (`src/components/ui/section-rail.tsx`) pinned at mid-viewport on an alternating side — hero left → work right → services left → stack right → … Section titles sit on the **opposite side of the rail** (hero centered is the exception). Rail fades in when the section content reaches mid-viewport; as the next section becomes visible it fades up and slides up (−96px, 1.4s `power3.inOut`); instant state changes under `prefers-reduced-motion`
- Every RAF loop (cursor, particles) pauses when the tab is hidden
- `prefers-reduced-motion`: disable cursor, lenis, and heavy reveals
- Custom cursor is desktop-only (never on touch devices)

## Tooling

- Context7 MCP reads its API key from the OS user environment variable `CTX7_API_KEY` (set once via `[Environment]::SetEnvironmentVariable('CTX7_API_KEY', '<key>', 'User')`). No secret lives in repo or shared config files. Restart the agent after setting it.

## Skills

Skills are installed in `.agents/skills/` (+ `.opencode/skills/`). When a task matches a category below, load the matching skill (Skill tool) BEFORE writing code. Use only the skill that fits the task — never stack unrelated skills.

**Design direction & reference images**

- `brandkit` — brand identity, logo systems, guideline boards
- `imagegen-frontend-web` — per-section web design reference images
- `imagegen-frontend-mobile` — mobile app screen concepts (not this project)
- `image-to-code` — generate design images, then implement to match

**Visual taste & style systems** (project language is B/W editorial)

- `design-taste-frontend` — anti-slop landing page / portfolio / redesign work
- `high-end-visual-design` — agency-grade polish, premium patterns
- `minimalist-ui` — clean editorial minimalism (closest to this project)
- `industrial-brutalist-ui` — raw brutalism (only when requested)
- `gpt-taste` — AIDA structure, gapless bentos, GSAP-heavy layouts
- `stitch-design-taste` — semantic DESIGN.md design systems
- `redesign-existing-projects` — upgrade an existing site to premium quality

**UI implementation**

- `shadcn` — add/configure shadcn/ui components
- `migrate-radix-to-base` — convert Radix → Base UI
- `vercel-composition-patterns` — compound components, render props, context
- `full-output-enforcement` — exhaustive, unabridged code output

**GSAP & motion** (this project's animation stack)

- `gsap-core` — tweens, easing, defaults, gsap.matchMedia()
- `gsap-react` — useGSAP, refs, cleanup in React
- `gsap-scrolltrigger` — scroll reveals, pinning, scrub
- `gsap-timeline` — sequenced/choreographed timelines
- `gsap-plugins` — ScrollSmoother, SplitText, Flip, Draggable, …
- `gsap-utils` — clamp, mapRange, snap, random helpers
- `gsap-performance` — 60fps, transform-only, no layout thrash
- `gsap-frameworks` — Vue/Svelte only (NOT this React project)

**Design review & audits**

- `impeccable` — critique, polish, or shape any interface
- `web-design-guidelines` — accessibility & web standards compliance
- `writing-guidelines` — copy/prose voice & tone check

**Next.js runtime & caching**

- `next-dev-loop` — verify a change in the running dev server
- `next-cache-components-adoption` / `next-cache-components-optimizer` — Cache Components work
- `next-partial-prefetching-adoption` — Partial Prefetching work

**Testing**

- `playwright-cli` — writing/debugging Playwright tests (pair with `npm run test:e2e`)

**Deployment**

- `deploy-to-vercel` — deploy and get a link
- `vercel-cli-with-tokens` — token-based Vercel CLI operations
- `vercel-optimize` — Vercel cost/performance tuning

**Git & tooling**

- `gh-stack` — stacked branches / dependent PRs
- `context7-mcp` — library/framework docs lookup
- `find-skills` — discover new installable skills
- `customize-opencode` — only when editing opencode's own config

## Build workflow

- **One section at a time.** Foundation first, then sections in order: preloader → navbar+menu → hero → work → services → stack → about → contact → footer
- After each section: run `npm run lint` and `npm run build`, then a visual check with `npm run dev`
- **E2E tests are opt-in:** run `npm run test:e2e` only when the user explicitly requests it. When requested, the Playwright config starts/reuses the dev server automatically. If the changed UI isn't covered, extend `e2e/*.spec.ts` with tests for it; never leave a failing test behind. Assertions pull expected copy from `src/lib/data.ts`, never hardcoded strings.
- Never proceed to the next section without user confirmation
- Only commit when the user explicitly asks
