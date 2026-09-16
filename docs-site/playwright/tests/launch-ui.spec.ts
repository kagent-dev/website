import { test, expect, gotoUI, settle } from '../fixtures/test';

/**
 * Baseline captures for Observability > Launch the UI
 * (content/kagent/1.x/observability/launch-ui.md).
 *
 * LIVE CLUSTER captures. These show real resources from a real kagent install, which is
 * the point: a reader who has just followed the install guide and port-forwarded the UI
 * should recognise what they see. Run them against a cluster provisioned by
 * `provisioners/kagent-kind.sh`, with the UI port-forwarded:
 *
 *   kubectl port-forward -n kagent svc/kagent-ui 8082:8080 &
 *   UI_BASE_URL=http://localhost:8082 npm run update:launch-ui
 *
 * Relative timestamps ("2 minutes ago") are left visible rather than masked — see the
 * note on `mask` in fixtures/test.ts for why, and what to do if one proves unstable. In
 * practice none of these three pages renders one.
 *
 * The Substrate capture DOES carry one volatile value: the worker pod name, which ends in
 * a ReplicaSet hash and a random suffix and so differs on every freshly created cluster.
 * It is deliberately not masked. The changed pixels are a fraction of a percent of a
 * full-page shot, well inside the tolerance, and a reader's own pod name will differ
 * anyway — so a magenta rectangle would cost more than it buys. Re-captures against the
 * SAME cluster are byte-identical, which is what the regression check actually watches.
 *
 * The conversation capture is NOT here. A live agent's reply is different text every
 * run, which is far past the 1% diff tolerance and cannot be a regression baseline, so
 * it is captured against the UI's own mock backend instead — see chat.spec.ts.
 */

test.describe('Launch the UI', () => {
  test('dashboard: the landing view after a port-forward', async ({ page }) => {
    await gotoUI(page, '/');

    // The summary tiles are what makes this the dashboard rather than a blank shell.
    await expect(page.getByTestId('dashboard-summary-grid')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('app-sidebar')).toBeVisible();
    await settle(page);

    await expect(page).toHaveScreenshot('kagent-ui-dashboard.png', { fullPage: true });
  });

  test('agents: the list an install starts with', async ({ page }) => {
    await gotoUI(page, '/agents');

    // Wait for the table itself, not merely the page frame: the rows arrive on a second
    // request, and capturing between the two produces a convincing empty-state image.
    await expect(page.getByTestId('agents-table')).toBeVisible({ timeout: 30_000 });
    await settle(page);

    await expect(page).toHaveScreenshot('kagent-ui-agents.png', { fullPage: true });
  });

  test('substrate: the compute agents run on', async ({ page }) => {
    await gotoUI(page, '/substrate');

    await expect(page.getByTestId('page-title')).toBeVisible({ timeout: 30_000 });
    await settle(page);

    await expect(page).toHaveScreenshot('kagent-ui-substrate.png', { fullPage: true });
  });
});
