import { test, expect, gotoUI, pinClock, settle } from '../fixtures/test';

/**
 * Baseline capture of a conversation, for Observability > Launch the UI.
 *
 * MOCK-BACKED, and deliberately so. A live agent composes a different reply every run,
 * which is most of the page changing — far past the 1% tolerance — so a live conversation
 * cannot be a regression baseline. The kagent UI ships an in-browser mock backend whose
 * seeded conversation has a fixed transcript, a checkpoint and a share
 * (ui/src/mocks/state.ts), which is exactly the 1.0 chat surface this page needs to show.
 *
 * The chat labels that checkpoint "Snapshot" and carries Fork, Rename and Delete on its
 * mark (kagent-dev/kagent#2847). That card is taller than the strip it replaced, so it
 * pushes the transcript's tool call above the fold: `fullPage` does not recover it,
 * because the transcript scrolls in its own container rather than with the page.
 *
 * Run it against a dev server from a kagent checkout, NOT against a cluster:
 *
 *   cd <kagent>/ui && VITE_API_MODE=mock yarn dev --port 8101
 *   UI_BASE_URL=http://localhost:8101 npm run update:chat
 *
 * `VITE_API_MODE` is a build-time pin and the released UI image ships no mock service
 * worker (ui/src/api/config.ts), so this cannot be captured from the published image —
 * it needs the source checkout.
 *
 * The spec needs no guard against being pointed at a cluster by mistake. The instance id
 * below exists only in the fixtures, so a live backend 404s it and the test fails loudly
 * instead of quietly capturing the wrong thing.
 */

/** The seeded conversation: ready, named, and the one with a transcript behind it. */
const SEEDED_INSTANCE = '6f1c9d20-1b7a-4a1e-9a3f-2c0d8e5b1a44';

test('conversation: the seeded transcript', async ({ page }) => {
  // Before gotoUI: the app formats its relative times on first render, so a clock pinned
  // afterwards changes nothing. Fixed data plus a fixed clock is what makes "3 days ago"
  // reproduce exactly.
  await pinClock(page);

  await gotoUI(page, `/agents/${SEEDED_INSTANCE}/chat`);

  // The composer is the last thing to mount, so it is the honest signal that the
  // conversation has finished loading rather than that its shell has.
  await expect(page.getByTestId('chat-composer')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId('chat-input')).toBeVisible();
  // Guards against capturing the empty state, which renders the same chrome.
  await expect(page.getByTestId('chat-empty')).toHaveCount(0);
  await settle(page);

  await expect(page).toHaveScreenshot('kagent-ui-chat.png', { fullPage: true });
});
