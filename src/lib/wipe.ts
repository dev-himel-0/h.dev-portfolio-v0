import gsap from "gsap";
import type Lenis from "lenis";

/**
 * Shared cinematic curtain wipe for the whole app — the staggered black
 * bands that the scroll-to-top button, in-page links and back/forward page
 * transitions all run through. One overlay is mounted by `WipeCurtain` in the
 * root layout and registered here, so every caller gets the identical
 * choreography from a single source of truth. Three modes exist:
 *
 * `wipeCover` — same-page actions (scroll-to-top, in-page anchors):
 *
 *   1. Cover — black panels rise from the bottom, staggered 0.07s apart over
 *      0.5s `power4.out`.
 *   2. Action — runs while the viewport is fully covered (scroll to a
 *      section).
 *   3. Hold — a 0.15s breath.
 *   4. Reveal — panels lift out to the top (yPercent → -101), staggered
 *      0.08s apart over 0.8s `power4.inOut`.
 *
 * `wipeCoverDeferred` — route navigation (link clicks and back/forward). The
 * incoming route commits asynchronously, at an unknowable moment, so the
 * page must never paint over an uncovered viewport:
 *
 *   1. Cover — black panels rise from the bottom (yPercent 101 → 0),
 *      staggered 0.07s apart over 0.5s `power4.out`, covering the current
 *      page completely before navigation begins.
 *   2. Action — runs under full cover (push the route, or nothing for
 *      back/forward, where the router commits on its own).
 *   3. Hold — until `completeWipe()` reports the incoming route has
 *      committed (called on the pathname change), or `DEFERRED_TIMEOUT` as a
 *      safety cap so the screen can never stay black.
 *   4. Reveal — panels lift out to the top (yPercent → -101), staggered
 *      0.08s apart over 0.8s `power4.inOut`.
 *
 * `wipeReveal` — entrance for hard-loaded non-home pages:
 *
 *   1. The curtain starts covered (yPercent 0), hiding the page on mount.
 *   2. Panels lift out to the top (yPercent → -101), staggered 0.08s apart
 *      over 0.8s `power4.inOut`, revealing the page.
 *
 * Lenis is stopped for the duration so the covered scroll never fights the
 * smooth-scroll loop, and the whole wipe is skipped (action runs instantly)
 * under `prefers-reduced-motion`. A `busy` guard swallows re-entrant calls
 * while a wipe is already playing.
 */

const WIPE_TIMING = {
  cover: 0.5,
  coverStagger: 0.07,
  hold: 0.15,
  reveal: 0.8,
  revealStagger: 0.08,
} as const;

/** Safety cap for a deferred wipe whose route never commits (ms). */
const DEFERRED_TIMEOUT = 4000;

const noop = () => {};

let overlayEl: HTMLElement | null = null;
let panelEls: HTMLElement[] = [];
let lenis: Lenis | null = null;
let busy = false;

/** Reveal callback of the deferred wipe currently covering the screen. */
let pendingReveal = noop;

/** Called by `WipeCurtain` when its overlay mounts (and on lenis swaps). */
export function registerWipeCurtain(
  overlay: HTMLElement,
  panels: HTMLElement[],
  lenisInstance: Lenis | null
) {
  overlayEl = overlay;
  panelEls = panels;
  lenis = lenisInstance ?? null;
}

/** Called by `WipeCurtain` on unmount. */
export function unregisterWipeCurtain() {
  overlayEl = null;
  panelEls = [];
  lenis = null;
  busy = false;
  pendingReveal = noop;
}

export function isWipeBusy() {
  return busy;
}

/** Whether the curtain overlay is mounted and ready to animate. */
export function isWipeReady() {
  return overlayEl !== null && panelEls.length > 0;
}

/**
 * Reveals the page for any deferred navigation wipe that is currently
 * holding the curtain up, waiting for the incoming route to commit. Called
 * on every pathname change; a no-op when nothing is pending or the wipe
 * already resolved its (reduced-motion / missing-overlay) path.
 */
export function completeWipe() {
  const reveal = pendingReveal;
  pendingReveal = noop;
  reveal();
}

function runAction(action: () => void) {
  try {
    action();
  } catch {
    // The wipe must always complete and reveal the page.
  }
}

/** Jump under a covered wipe without leaving Lenis' target out of sync. */
export function scrollToInstant(target: number | HTMLElement) {
  if (lenis) {
    lenis.scrollTo(target, { immediate: true, force: true });
    return;
  }

  const top =
    typeof target === "number"
      ? target
      : target.getBoundingClientRect().top + window.scrollY;
  window.scrollTo({ top, behavior: "instant" });
}

function resetWipe() {
  if (overlayEl) gsap.set(overlayEl, { display: "none" });
  lenis?.start();
  busy = false;
}

/**
 * Plays the shared wipe around `action`. Resolves when the overlay is hidden
 * again (immediately under reduced motion, or if the overlay is missing).
 * If a wipe is already in flight, `action` still runs right away so a
 * navigation is never dropped — the in-flight wipe's reveal then shows
 * whatever the action committed underneath.
 */
export function wipeCover(action: () => void): Promise<void> {
  return new Promise((resolve) => {
    const finish = () => {
      resetWipe();
      resolve();
    };

    if (busy) {
      runAction(action);
      resolve();
      return;
    }
    busy = true;

    // An unregistered overlay degrades to an instant action.
    if (!overlayEl || panelEls.length === 0) {
      runAction(action);
      finish();
      return;
    }

    lenis?.stop();
    gsap.set(overlayEl, { display: "flex" });
    gsap.set(panelEls, { yPercent: 101, autoAlpha: 1 });

    gsap
      .timeline({ onComplete: finish })
      .to(panelEls, {
        yPercent: 0,
        duration: WIPE_TIMING.cover,
        ease: "power4.out",
        stagger: WIPE_TIMING.coverStagger,
      })
      .add(() => runAction(action))
      .to({}, { duration: WIPE_TIMING.hold })
      .to(panelEls, {
        yPercent: -101,
        duration: WIPE_TIMING.reveal,
        ease: "power4.inOut",
        stagger: WIPE_TIMING.revealStagger,
      });
  });
}

/**
 * Route-navigation version of the wipe: the panels rise from bottom to cover
 * the current viewport (yPercent: 101 → 0), then `action` runs under full cover,
 * and the reveal is held until `completeWipe()` confirms the incoming route
 * committed — so the incoming page is only revealed when the transition
 * animation finishes. Falls back to the reveal after `DEFERRED_TIMEOUT` ms so
 * a lost navigation can never leave the screen black. Same reduced-motion,
 * missing overlay and `busy` semantics as `wipeCover`.
 */
export function wipeCoverDeferred(action: () => void): Promise<void> {
  return new Promise((resolve) => {
    const finish = () => {
      resetWipe();
      pendingReveal = noop;
      resolve();
    };

    if (busy) {
      runAction(action);
      resolve();
      return;
    }
    busy = true;

    // An unregistered overlay degrades to an instant action.
    if (!overlayEl || panelEls.length === 0) {
      runAction(action);
      finish();
      return;
    }

    lenis?.stop();
    gsap.set(overlayEl, { display: "flex" });
    gsap.set(panelEls, { yPercent: 101, autoAlpha: 1 });

    let routeCommitted = false;
    let settled = false;

    const settle = () => {
      if (settled) return;
      settled = true;
      pendingReveal = noop;
      gsap.to(panelEls, {
        yPercent: -101,
        duration: WIPE_TIMING.reveal,
        delay: WIPE_TIMING.hold,
        ease: "power4.inOut",
        stagger: WIPE_TIMING.revealStagger,
        onComplete: finish,
      });
    };

    // 1. Cover: panels animate in from bottom to cover the viewport completely.
    gsap.to(panelEls, {
      yPercent: 0,
      duration: WIPE_TIMING.cover,
      ease: "power4.out",
      stagger: WIPE_TIMING.coverStagger,
      onComplete: () => {
        // 2. Action: Execute navigation under solid black cover.
        runAction(action);

        pendingReveal = () => {
          settle();
        };

        // If route committed while covering or immediately, reveal now.
        if (routeCommitted) {
          settle();
        } else {
          setTimeout(settle, DEFERRED_TIMEOUT);
        }
      },
    });

    // completeWipe() calls pendingReveal when incoming route commits.
    pendingReveal = () => {
      routeCommitted = true;
    };
  });
}

/**
 * Direct entrance reveal for hard-loaded non-home routes: sets the curtain
 * covered (yPercent: 0) immediately so the page is hidden, then animates the
 * panel lift (yPercent: 0 → -101) to reveal the page cleanly.
 */
export function wipeReveal(): Promise<void> {
  return new Promise((resolve) => {
    const finish = () => {
      resetWipe();
      resolve();
    };

    if (busy) {
      resolve();
      return;
    }
    busy = true;

    if (!overlayEl || panelEls.length === 0) {
      finish();
      return;
    }

    lenis?.stop();
    gsap.set(overlayEl, { display: "flex" });
    gsap.set(panelEls, { yPercent: 0, autoAlpha: 1 });

    gsap.to(panelEls, {
      yPercent: -101,
      duration: WIPE_TIMING.reveal,
      delay: WIPE_TIMING.hold,
      ease: "power4.inOut",
      stagger: WIPE_TIMING.revealStagger,
      onComplete: finish,
    });
  });
}
