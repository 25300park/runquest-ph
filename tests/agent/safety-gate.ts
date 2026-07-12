import type { HumanTestRequest, PlannedStep, TestEnvironment } from './types';

function hasHumanApproval(request: HumanTestRequest) {
  return Boolean(request.approval_token && request.approval_token === process.env.TEST_AGENT_APPROVAL_TOKEN);
}

export function validateSafety(request: HumanTestRequest, steps: PlannedStep[]) {
  const reasons: string[] = [];
  const environment: TestEnvironment = request.environment;
  const approved = hasHumanApproval(request);

  if (environment === 'production-readonly') {
    if (request.allow_data_creation || request.allow_data_update || request.allow_data_deletion) {
      reasons.push('Production mode is read-only by default.');
    }
  }

  if (steps.some((step) => step.destructive) && (!request.allow_data_deletion || !approved)) {
    reasons.push('Destructive action requires explicit human approval.');
  }

  if (steps.some((step) => step.payment) && (!request.allow_payment || !approved)) {
    reasons.push('Payment checkout requires explicit human approval.');
  }

  if (steps.some((step) => step.writesProduction) && !approved) {
    reasons.push('Writing to production requires explicit human approval.');
  }

  if (steps.some((step) => step.text.toLowerCase().includes('ban') || step.text.toLowerCase().includes('suspend'))) {
    reasons.push('Banning or suspending users is blocked for the test agent.');
  }

  return {
    allowed: reasons.length === 0,
    reason: reasons.join(' ')
  };
}
