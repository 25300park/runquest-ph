import { readFile } from 'node:fs/promises';
import type { HumanTestRequest, TestReport } from './types';
import { planTest } from './test-planner';
import { executePlan } from './test-executor';
import { writeReport } from './test-reporter';
import { verifySupabaseState } from './supabase-verifier';

async function readRequest(): Promise<HumanTestRequest> {
  const input = process.argv[2] || process.env.TEST_AGENT_REQUEST;

  if (!input) {
    throw new Error('Provide a JSON request string or a path to a JSON request file.');
  }

  if (input.trim().startsWith('{')) {
    return JSON.parse(input) as HumanTestRequest;
  }

  return JSON.parse(await readFile(input, 'utf8')) as HumanTestRequest;
}

function severityFor(status: TestReport['status'], consoleErrors: string[], networkFailures: string[]) {
  if (status === 'BLOCKED') return 'medium';
  if (status === 'FAIL' && (consoleErrors.length > 0 || networkFailures.length > 0)) return 'high';
  if (status === 'FAIL') return 'medium';
  return 'low';
}

async function main() {
  const request = await readRequest();
  const plan = planTest(request);
  const execution = await executePlan(plan);
  const supabaseVerification = await verifySupabaseState(plan);
  const report: TestReport = {
    testRunId: plan.runId,
    environment: plan.environment,
    scenario: plan.title,
    expected: plan.expected,
    actual: execution.actual,
    status: execution.status,
    failedStep: execution.failedStep,
    url: execution.evidence.currentUrl,
    consoleErrors: execution.evidence.consoleErrors,
    networkFailures: execution.evidence.networkFailures,
    supabaseVerification,
    screenshots: execution.evidence.screenshots,
    tracePath: execution.evidence.tracePath,
    videoPath: execution.evidence.videoPath,
    severity: severityFor(execution.status, execution.evidence.consoleErrors, execution.evidence.networkFailures),
    reproducibleSteps: plan.steps.map((step) => step.text),
    recommendedFix:
      execution.status === 'PASS'
        ? 'No fix required.'
        : execution.status === 'BLOCKED'
          ? 'Request explicit approval or change the request to read-only.'
          : 'Inspect screenshot, trace, console errors, and network failures.',
    retestRecommendation:
      execution.status === 'PASS' ? 'Retest after related deployment changes.' : 'Retest after fixing the failed step.',
    createdAt: new Date().toISOString()
  };
  const paths = await writeReport(report);
  console.log(JSON.stringify({ status: report.status, report: paths, testRunId: report.testRunId }, null, 2));

  if (report.status === 'FAIL') process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Test agent failed.');
  process.exitCode = 1;
});
