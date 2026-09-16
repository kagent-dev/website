import { test as base, expect, type Page } from '@playwright/test';

/**
 * Shared fixtures and helpers for kagent UI captures.
 *
 * The one thing this file must get right is that the theme is seeded BEFORE the app
 * boots. `ui/src/theme/themeMode.tsx` reads its stored mode once, on first render, and
 * falls back to `prefers-color-scheme` when nothing is stored — so a value written after
 * `goto` is read by nobody and every "dark" capture comes back light. `addInitScript`
 * runs on every document before any page script, which is the only hook early enough.
 */

/** The key `ui/src/theme/themeMode.tsx` persists the reader's choice under. */
const THEME_STORAGE_KEY = 'kagent.themeMode';

export const test = base.extend<{ page: Page }>({
  page: async ({ page }, use, testInfo) => {
    // The project name IS the theme — see the `projects` note in playwright.config.ts.
    const theme = testInfo.project.name === 'dark' ? 'dark' : 'light';
    await page.addInitScript(
      ([key, value]) => {
        try {
          window.localStorage.setItem(key, value);
        } catch {
          // A browser with storage disabled throws rather than returning null. The app
          // guards the same way and falls back to the system theme; swallowing here
          // keeps the capture running so the failure shows up as a wrong-theme image
          // rather than an unrelated crash.
        }
      },
      [THEME_STORAGE_KEY, theme],
    );
    await use(page);
  },
});

export { expect };

/**
 * Navigate and wait for the persistent shell to have rendered.
 *
 * Not `networkidle`: the chat route holds an open stream, so the network never goes
 * idle and the wait times out at 30s having captured nothing. Waiting on rendered
 * content is both faster and correct on every route.
 */
export async function gotoUI(page: Page, path: string): Promise<void> {
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  await expect(page.getByTestId('app-content')).toBeVisible({ timeout: 30_000 });
}

/**
 * Freeze the browser clock, for MOCK-BACKED captures only.
 *
 * The mock fixtures carry fixed timestamps, and the UI renders them through date-fns
 * `formatDistanceToNow` ("3 days ago"). Fixed data plus a moving clock is what makes
 * those strings drift, so pinning the clock against fixed data makes them exact.
 *
 * Do NOT call this on a live-cluster capture. There the data timestamps are whenever
 * the provisioner happened to run, so a frozen clock renders a real resource as
 * created in the future.
 *
 * Must be called before `gotoUI`, since the app formats on first render.
 */
export async function pinClock(page: Page): Promise<void> {
  await page.clock.setFixedTime(new Date('2026-01-15T12:00:00Z'));
}

/**
 * Wait for the page to stop moving before capturing.
 *
 * `animations: 'disabled'` in the config stops CSS animations at their end state, but it
 * does not wait for antd's mount transitions to have been *scheduled*. Two frames is
 * enough for layout to settle and costs nothing.
 */
export async function settle(page: Page): Promise<void> {
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  );
}

/**
 * Mask locators whose content is genuinely unreadable-by-design, e.g. a generated id.
 *
 * Used sparingly and never by default. A mask paints a solid rectangle into the
 * PUBLISHED image, so it is right for a UUID nobody reads and wrong for a timestamp
 * column a reader expects to see. Live-cluster captures deliberately keep their real
 * relative times and rely on the config's `maxDiffPixelRatio: 0.01` having headroom —
 * a few words of "2 minutes ago" is a tiny share of a 1440x900 page. If a capture does
 * prove unstable, mask it in that spec rather than loosening the ratio: a looser ratio
 * hides real content changes too, and `--update-snapshots` then declines to rewrite the
 * stale baseline because the old one still "passes".
 */
export function mask(page: Page, testIds: string[]) {
  return { mask: testIds.map((id) => page.getByTestId(id)) };
}
