/**
 * Module-level navigation bookkeeping for the client bundle. `markSoftNavigation`
 * is called by the page transition layer whenever a client-side route change
 * commits (pathname changed while the layout stayed mounted). A full page load
 * never calls it, so `isSoftNavigation()` stays `false` on first paint.
 */
let softNavigation = false

export function markSoftNavigation() {
  softNavigation = true
}

export function isSoftNavigation() {
  return softNavigation
}
