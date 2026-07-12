import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import type { Page, Response } from '@playwright/test';
import type { Evidence } from './types';

export function createEvidenceCollector(runId: string) {
  const evidence: Evidence = {
    consoleErrors: [],
    networkFailures: [],
    screenshots: []
  };

  return {
    evidence,
    attach(page: Page) {
      page.on('console', (message) => {
        if (['error', 'warning'].includes(message.type())) {
          evidence.consoleErrors.push(`[${message.type()}] ${message.text()}`);
        }
      });
      page.on('response', (response: Response) => {
        if (response.status() >= 400) {
          evidence.networkFailures.push(`${response.status()} ${response.url()}`);
        }
      });
      page.on('requestfailed', (request) => {
        evidence.networkFailures.push(`${request.failure()?.errorText ?? 'failed'} ${request.url()}`);
      });
    },
    async snapshot(page: Page, label: string) {
      await mkdir('test-results/screenshots', { recursive: true });
      const screenshotPath = path.join('test-results', 'screenshots', `${runId}-${label}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      evidence.screenshots.push(screenshotPath);
      evidence.currentUrl = page.url();
      evidence.visibleText = (await page.locator('body').innerText({ timeout: 5_000 }))
        .split(/\r?\n/)
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 80);
      return evidence;
    }
  };
}
