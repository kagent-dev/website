import { defineConfig, devices } from '@playwright/test';

/**
 * Screenshot automation for the kagent product UI.
 *
 * This ATTACHES to an already-running kagent UI. It does not bring one up — a kagent
 * installation is a cluster, Agent Substrate, the kagent chart and a model provider key,
 * which is far heavier than one command, so the environment is a sibling prerequisite
 * rather than a step inside the capture. Bring the UI up yourself, then point this at it:
 *
 *   kubectl port-forward -n kagent svc/kagent-ui 8082:8080 &
 *   UI_BASE_URL=http://localhost:8082 npm run update:launch-ui
 *
 * `provisioners/kagent-kind.sh` creates the cluster and installs both charts at the
 * versions the install guide pins, so a capture matches what a reader gets.
 *
 * There is deliberately no `webServer`. That is also what makes the mock fallback work:
 * the kagent UI ships an in-browser mock backend, so `UI_BASE_URL` can point at a
 * `yarn dev` server from a kagent checkout instead of a cluster. See the README for when
 * that is the right call and when it is not.
 *
 * Env knobs:
 *   UI_BASE_URL   base URL of the running UI (default http://localhost:8082, the port
 *                 `kagent dashboard` forwards to, so the default matches the docs)
 */
const BASE_URL = process.env.UI_BASE_URL || 'http://localhost:8082';

export default defineConfig({
  testDir: './tests',
  snapshotDir: './__screenshots__',
  // Platform-neutral baseline names (no -darwin/-linux suffix), so one committed set
  // serves both CI (Linux) and local preview, and sync-docs is never ambiguous about
  // which file to publish.
  snapshotPathTemplate: '{snapshotDir}/{testFileDir}/{testFileName}-snapshots/{arg}{-projectName}{ext}',
  fullyParallel: false,
  // One worker. The specs drive a real cluster and the chat capture creates an
  // AgentInstance, so concurrent runs would race the same resources and produce
  // nondeterministic captures. Do not raise this.
  workers: 1,
  forbidOnly: !!process.env.CI,
  reporter: [['html', { open: 'never' }], ['list']],

  use: {
    baseURL: BASE_URL,
  },

  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,
      animations: 'disabled',
    },
  },

  /**
   * Projects are keyed by THEME, not by docs version.
   *
   * The kagent UI exposes a theme control Playwright can drive — it reads
   * `localStorage["kagent.themeMode"]` on boot (ui/src/theme/themeMode.tsx) — so light
   * and dark are two real captures and the guides can carry a theme-aware pair.
   *
   * Version is not a baseline axis here, which is the part worth not reversing. Only the
   * 1.x docs use these captures: the 0.x tree is frozen, and it references images as raw
   * markdown against `static/images/`, never through the `reuse-image` shortcodes this
   * harness publishes for. So there is nothing for a second version project to keep
   * apart, and no DOC_VERSION knob — the publish destination is written out per image in
   * docs-image-map.json instead. If a version line ever does diverge, repoint that image's
   * `dest` at the theme's version override directory (the README has the mechanism);
   * adding the version to the project name renames every committed baseline, so leave
   * that until a second version is genuinely being captured.
   */
  projects: [
    {
      name: 'light',
      use: {
        ...devices['Desktop Chrome'],
        // AFTER the spread, deliberately. `devices['Desktop Chrome']` carries its own
        // 1280x720 viewport, which silently wins over a top-level `use.viewport` — the
        // trap that left the agentgateway harness's committed baselines at 1280x720 while
        // its config said 1440x900. Setting both here is what actually pins the pixels.
        viewport: { width: 1440, height: 900 },
        deviceScaleFactor: 1,
      },
    },
    {
      name: 'dark',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
        deviceScaleFactor: 1,
      },
    },
  ],
});
