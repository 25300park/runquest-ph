import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { TestReport } from './types';

function markdown(report: TestReport) {
  return `# RunQuest PH Test Report

- Test run ID: ${report.testRunId}
- Environment: ${report.environment}
- Scenario: ${report.scenario}
- Status: ${report.status}
- Severity: ${report.severity}
- URL: ${report.url ?? 'n/a'}
- Created: ${report.createdAt}

## Expected

\`\`\`json
${JSON.stringify(report.expected, null, 2)}
\`\`\`

## Actual

\`\`\`json
${JSON.stringify(report.actual, null, 2)}
\`\`\`

## Failed Step

${report.failedStep ?? 'n/a'}

## Console Errors

${report.consoleErrors.length ? report.consoleErrors.map((item) => `- ${item}`).join('\n') : 'None'}

## Network Failures

${report.networkFailures.length ? report.networkFailures.map((item) => `- ${item}`).join('\n') : 'None'}

## Supabase Verification

\`\`\`json
${JSON.stringify(report.supabaseVerification, null, 2)}
\`\`\`

## Evidence

- Screenshots: ${report.screenshots.join(', ') || 'None'}
- Trace: ${report.tracePath ?? 'n/a'}
- Video: ${report.videoPath ?? 'n/a'}

## Reproducible Steps

${report.reproducibleSteps.map((step, index) => `${index + 1}. ${step}`).join('\n')}

## Recommended Fix

${report.recommendedFix}

## Retest Recommendation

${report.retestRecommendation}
`;
}

export async function writeReport(report: TestReport) {
  await mkdir('test-results/reports', { recursive: true });
  const basePath = path.join('test-results', 'reports', report.testRunId);
  await writeFile(`${basePath}.json`, JSON.stringify(report, null, 2));
  await writeFile(`${basePath}.md`, markdown(report));
  return {
    json: `${basePath}.json`,
    markdown: `${basePath}.md`
  };
}
