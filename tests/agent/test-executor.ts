import { chromium, devices, type Browser, type BrowserContext, type Page } from '@playwright/test';
import type { Evidence, TestPlan, TestStatus } from './types';
import { createEvidenceCollector } from './evidence-collector';

function baseUrlForEnvironment(environment: TestPlan['environment']) {
  if (environment === 'production-readonly') {
    return process.env.PRODUCTION_URL || process.env.TEST_BASE_URL || 'https://runquest-ph.vercel.app';
  }
  return process.env.TEST_BASE_URL || process.env.PRODUCTION_URL || 'http://127.0.0.1:4173';
}

async function loginIfCredentialsExist(page: Page, actor: TestPlan['actor']) {
  const email =
    actor === 'admin'
      ? process.env.TEST_ADMIN_EMAIL
      : actor === 'premium_user'
        ? process.env.TEST_PREMIUM_EMAIL
        : process.env.TEST_FREE_EMAIL;
  const password =
    actor === 'admin'
      ? process.env.TEST_ADMIN_PASSWORD
      : actor === 'premium_user'
        ? process.env.TEST_PREMIUM_PASSWORD
        : process.env.TEST_FREE_PASSWORD;

  if (!email || !password) return false;

  await page.goto('/login');
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /login/i }).click();
  await page.waitForLoadState('networkidle').catch(() => undefined);
  return true;
}

export type ExecutionResult = {
  status: TestStatus;
  actual: Record<string, unknown>;
  failedStep?: string;
  evidence: Evidence;
};

export async function executePlan(plan: TestPlan): Promise<ExecutionResult> {
  if (plan.blockedReason) {
    return {
      status: 'BLOCKED',
      actual: { blockedReason: plan.blockedReason },
      failedStep: plan.blockedReason,
      evidence: { consoleErrors: [], networkFailures: [], screenshots: [] }
    };
  }

  let browser: Browser | null = null;
  let context: BrowserContext | null = null;

  try {
    browser = await chromium.launch({ headless: process.env.TEST_HEADED !== 'true' });
    context = await browser.newContext({
      baseURL: baseUrlForEnvironment(plan.environment),
      ...devices['Pixel 5'],
      recordVideo: { dir: 'test-results/videos' }
    });
    await context.tracing.start({ screenshots: true, snapshots: true, sources: true });
    const page = await context.newPage();
    const collector = createEvidenceCollector(plan.runId);
    collector.attach(page);

    for (const step of plan.steps) {
      if (step.action === 'blocked') {
        await collector.snapshot(page, 'blocked');
        return {
          status: 'BLOCKED',
          actual: { blockedStep: step.text },
          failedStep: step.text,
          evidence: collector.evidence
        };
      }

      if (step.target?.startsWith('/')) {
        await page.goto(step.target);
        await page.waitForLoadState('networkidle').catch(() => undefined);
      } else if (step.action === 'navigate' && step.text.toLowerCase().includes('login')) {
        await loginIfCredentialsExist(page, plan.actor);
      } else if (step.action === 'click' && step.target) {
        await page.locator(step.target).first().click({ timeout: 10_000 });
      } else if (step.action === 'assert') {
        await page.locator('body').waitFor({ state: 'visible' });
      } else {
        await page.locator('body').waitFor({ state: 'visible' });
      }
    }

    await collector.snapshot(page, 'final');
    const tracePath = `test-results/traces/${plan.runId}.zip`;
    await context.tracing.stop({ path: tracePath });
    collector.evidence.tracePath = tracePath;
    const video = page.video();
    if (video) {
      collector.evidence.videoPath = await video.path().catch(() => undefined);
    }

    return {
      status: collector.evidence.consoleErrors.length || collector.evidence.networkFailures.length ? 'FAIL' : 'PASS',
      actual: {
        currentUrl: page.url(),
        visibleText: collector.evidence.visibleText
      },
      evidence: collector.evidence
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown execution error';
    return {
      status: 'FAIL',
      actual: { error: message },
      failedStep: message,
      evidence: { consoleErrors: [message], networkFailures: [], screenshots: [] }
    };
  } finally {
    if (context) await context.close().catch(() => undefined);
    if (browser) await browser.close().catch(() => undefined);
  }
}
