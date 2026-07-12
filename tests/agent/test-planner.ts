import { randomUUID } from 'node:crypto';
import type { HumanTestRequest, PlannedStep, TestActor, TestPlan } from './types';
import { validateSafety } from './safety-gate';

function normalizeActor(actor: HumanTestRequest['actor']): TestActor {
  if (actor === 'free') return 'free_user';
  if (actor === 'premium') return 'premium_user';
  return actor;
}

function classifyStep(text: string, index: number): PlannedStep {
  const lower = text.toLowerCase();
  const base = { id: `step-${index + 1}`, text };

  if (lower.includes('login')) return { ...base, action: 'navigate', target: '/login' };
  if (lower.includes('admin')) return { ...base, action: 'navigate', target: '/admin' };
  if (lower.includes('exploration map') || lower.includes('map')) return { ...base, action: 'navigate', target: '/map' };
  if (lower.includes('course builder')) {
    return { ...base, action: 'navigate', target: '/course-builder', writesProduction: lower.includes('save') };
  }
  if (lower.includes('start course')) return { ...base, action: 'click', target: 'text=Start Course' };
  if (lower.includes('verify') || lower.includes('ensure')) return { ...base, action: 'assert' };
  if (lower.includes('supabase')) return { ...base, action: 'supabase-verify' };
  if (lower.includes('delete')) return { ...base, action: 'blocked', destructive: true };
  if (lower.includes('payment') || lower.includes('checkout')) return { ...base, action: 'blocked', payment: true };
  if (lower.includes('create') || lower.includes('save') || lower.includes('update')) {
    return { ...base, action: 'observe', writesProduction: true };
  }
  return { ...base, action: 'observe' };
}

export function planTest(request: HumanTestRequest): TestPlan {
  const steps = request.steps.map(classifyStep);
  const safety = validateSafety(request, steps);
  const plan: TestPlan = {
    runId: `rq-${Date.now()}-${randomUUID().slice(0, 8)}`,
    title: request.title,
    environment: request.environment,
    actor: normalizeActor(request.actor),
    goal: request.goal,
    steps,
    expected: request.expected ?? {}
  };

  if (!safety.allowed) {
    return {
      ...plan,
      steps: steps.map((step) => ({ ...step, action: step.action === 'blocked' ? 'blocked' : step.action })),
      blockedReason: safety.reason
    };
  }

  return plan;
}
