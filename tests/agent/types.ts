export type TestEnvironment = 'staging' | 'production-readonly';
export type TestActor = 'free_user' | 'premium_user' | 'admin';
export type TestStatus = 'PASS' | 'FAIL' | 'BLOCKED';
export type Severity = 'low' | 'medium' | 'high' | 'critical';

export type HumanTestRequest = {
  title: string;
  environment: TestEnvironment;
  actor: TestActor | 'free' | 'premium';
  goal: string;
  steps: string[];
  expected?: Record<string, unknown>;
  allow_data_creation?: boolean;
  allow_data_update?: boolean;
  allow_data_deletion?: boolean;
  allow_payment?: boolean;
  approval_token?: string;
  exploratory?: boolean;
};

export type PlannedStep = {
  id: string;
  text: string;
  action: 'navigate' | 'click' | 'fill' | 'assert' | 'observe' | 'supabase-verify' | 'blocked';
  target?: string;
  value?: string;
  destructive?: boolean;
  payment?: boolean;
  writesProduction?: boolean;
};

export type TestPlan = {
  runId: string;
  title: string;
  environment: TestEnvironment;
  actor: TestActor;
  goal: string;
  steps: PlannedStep[];
  expected: Record<string, unknown>;
  blockedReason?: string;
};

export type Evidence = {
  currentUrl?: string;
  visibleText?: string[];
  consoleErrors: string[];
  networkFailures: string[];
  screenshots: string[];
  tracePath?: string;
  videoPath?: string;
};

export type SupabaseVerification = {
  checked: boolean;
  passed: boolean;
  details: Record<string, unknown>;
  error?: string;
};

export type TestReport = {
  testRunId: string;
  environment: TestEnvironment;
  scenario: string;
  expected: Record<string, unknown>;
  actual: Record<string, unknown>;
  status: TestStatus;
  failedStep?: string;
  url?: string;
  consoleErrors: string[];
  networkFailures: string[];
  supabaseVerification: SupabaseVerification;
  screenshots: string[];
  tracePath?: string;
  videoPath?: string;
  severity: Severity;
  reproducibleSteps: string[];
  recommendedFix: string;
  retestRecommendation: string;
  createdAt: string;
};
