import { test, expect, gotoUI, settle } from '../fixtures/test';

// Capture an existing, completed live conversation; do not invoke a model or
// manufacture tool results. Opt in with the Session ID from the sandbox guide.
const sessionID = process.env.SANDBOX_SESSION_ID;

test('sandbox tool calls in a completed Session', async ({ page }) => {
  test.skip(!sessionID, 'Set SANDBOX_SESSION_ID to a completed code-runner Session.');
  await gotoUI(page, `/agents/${sessionID}/chat`);
  await expect(page.getByTestId('agent-rail-identity')).toContainText('code-runner');
  const deleted = page.getByTestId('chat-tool-result').filter({ hasText: 'delete_sandbox' }).last();
  await expect(deleted).toContainText('RUNTIME_STATE_DELETED');
  const answer = page.getByTestId('chat-message-text').last();
  await expect(answer).toContainText('Exit code: 0');
  await answer.scrollIntoViewIfNeeded();
  await settle(page);
  await expect(page).toHaveScreenshot('kagent-ui-sandbox-tools.png');
});
