# RunQuest PH Human-Guided AI Test Agent

The test agent executes natural-language test requests from the human owner.
It plans the browser test, runs Playwright, collects evidence, verifies Supabase state from Node/CI, and writes Markdown/JSON reports.

## Commands

```bash
npm run build
npm run test:e2e
npm run test:mobile
npm run test:headed
npm run test:report
npm run test:agent -- ./test-request.json
```

## Required Environment Variables

```text
TEST_BASE_URL
PRODUCTION_URL
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

Optional for authenticated tests:

```text
TEST_FREE_EMAIL
TEST_FREE_PASSWORD
TEST_PREMIUM_EMAIL
TEST_PREMIUM_PASSWORD
TEST_ADMIN_EMAIL
TEST_ADMIN_PASSWORD
```

Optional for CI-only Supabase verification:

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

Optional for approved destructive/payment tests:

```text
TEST_AGENT_APPROVAL_TOKEN
```

## Human Test Request

```json
{
  "title": "Greenway round-trip test",
  "environment": "staging",
  "actor": "free_user",
  "goal": "Verify that Greenway Course uses the real Supabase route and supports two round trips.",
  "steps": [
    "Login",
    "Open Exploration Map",
    "Select Greenway Course",
    "Select 2 round trips",
    "Verify total distance",
    "Start Course",
    "Verify the same Supabase course is loaded"
  ],
  "expected": {
    "distance_km": 5.0,
    "mock_data_allowed": false
  },
  "allow_data_creation": false,
  "allow_data_update": false,
  "allow_data_deletion": false,
  "allow_payment": false
}
```

## Safety Rules

- Production mode defaults to read-only.
- Payment checkout is blocked unless `allow_payment` and `TEST_AGENT_APPROVAL_TOKEN` are both present.
- Deletion is blocked unless `allow_data_deletion` and `TEST_AGENT_APPROVAL_TOKEN` are both present.
- The agent must never invent a successful result.
- The agent does not modify source code during a test run.

## Reports

Reports are generated under:

```text
test-results/reports/
test-results/screenshots/
test-results/traces/
test-results/videos/
```

Each report includes status, expected vs actual result, failed step, URL, console errors, network failures, Supabase verification, evidence paths, severity, reproducible steps, recommended fix, and retest recommendation.
