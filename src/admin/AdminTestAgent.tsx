import { useMemo, useState } from 'react';

const sampleRequest = {
  title: 'Greenway round-trip test',
  environment: 'staging',
  actor: 'free_user',
  goal: 'Verify that a Supabase course supports route detail and start flow without mock data.',
  steps: ['Login', 'Open Exploration Map', 'Select Course', 'Verify total distance', 'Start Course'],
  expected: {
    mock_data_allowed: false
  },
  allow_data_creation: false,
  allow_data_update: false,
  allow_data_deletion: false,
  allow_payment: false
};

export default function AdminTestAgent() {
  const [environment, setEnvironment] = useState<'staging' | 'production-readonly'>('production-readonly');
  const [actor, setActor] = useState<'free_user' | 'premium_user' | 'admin'>('free_user');
  const [allowCreate, setAllowCreate] = useState(false);
  const [allowUpdate, setAllowUpdate] = useState(false);
  const [allowDelete, setAllowDelete] = useState(false);
  const [allowPayment, setAllowPayment] = useState(false);
  const [requestText, setRequestText] = useState(JSON.stringify(sampleRequest, null, 2));
  const [status, setStatus] = useState('Ready. Production mode defaults to read-only.');

  const mergedRequest = useMemo(() => {
    try {
      const parsed = JSON.parse(requestText);
      return JSON.stringify(
        {
          ...parsed,
          environment,
          actor,
          allow_data_creation: allowCreate,
          allow_data_update: allowUpdate,
          allow_data_deletion: allowDelete,
          allow_payment: allowPayment
        },
        null,
        2
      );
    } catch {
      return requestText;
    }
  }, [actor, allowCreate, allowDelete, allowPayment, allowUpdate, environment, requestText]);

  function validateRequest() {
    try {
      const parsed = JSON.parse(mergedRequest);
      if (parsed.environment === 'production-readonly' && (parsed.allow_data_creation || parsed.allow_data_update || parsed.allow_data_deletion)) {
        setStatus('BLOCKED: production-readonly cannot create, update, or delete data.');
        return;
      }
      if (parsed.allow_payment) {
        setStatus('BLOCKED: payment checkout requires explicit CLI approval token.');
        return;
      }
      setStatus('Request is safe to run through npm run test:agent.');
    } catch {
      setStatus('Invalid JSON request.');
    }
  }

  return (
    <section className="space-y-4">
      <div className="rounded-lg border border-stone-800 bg-stone-950 p-4">
        <p className="text-xs font-black uppercase text-amber-200">Human-guided AI test agent</p>
        <h2 className="mt-1 text-2xl font-black">Test Request Console</h2>
        <p className="mt-2 text-sm text-stone-400">
          Define what should be tested. The agent plans, executes, collects evidence, and writes a report.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <label className="block rounded-lg border border-stone-800 bg-stone-950 p-3 text-sm">
          <span className="text-xs uppercase text-stone-500">Environment</span>
          <select
            value={environment}
            onChange={(event) => setEnvironment(event.target.value as 'staging' | 'production-readonly')}
            className="mt-2 w-full rounded-md bg-stone-900 p-2 text-stone-100"
          >
            <option value="production-readonly">production-readonly</option>
            <option value="staging">staging</option>
          </select>
        </label>

        <label className="block rounded-lg border border-stone-800 bg-stone-950 p-3 text-sm">
          <span className="text-xs uppercase text-stone-500">Actor</span>
          <select
            value={actor}
            onChange={(event) => setActor(event.target.value as 'free_user' | 'premium_user' | 'admin')}
            className="mt-2 w-full rounded-md bg-stone-900 p-2 text-stone-100"
          >
            <option value="free_user">free user</option>
            <option value="premium_user">premium user</option>
            <option value="admin">admin</option>
          </select>
        </label>

        <div className="rounded-lg border border-stone-800 bg-stone-950 p-3 text-sm">
          <p className="text-xs uppercase text-stone-500">Permissions</p>
          {[
            ['Create data', allowCreate, setAllowCreate],
            ['Update data', allowUpdate, setAllowUpdate],
            ['Delete data', allowDelete, setAllowDelete],
            ['Payment', allowPayment, setAllowPayment]
          ].map(([label, value, setter]) => (
            <label key={String(label)} className="mt-2 flex items-center gap-2">
              <input
                type="checkbox"
                checked={Boolean(value)}
                onChange={(event) => (setter as (next: boolean) => void)(event.target.checked)}
              />
              <span>{String(label)}</span>
            </label>
          ))}
        </div>
      </div>

      <textarea
        value={requestText}
        onChange={(event) => setRequestText(event.target.value)}
        className="min-h-[360px] w-full rounded-lg border border-stone-800 bg-stone-950 p-4 font-mono text-sm text-stone-100"
      />

      <div className="rounded-lg border border-stone-800 bg-stone-950 p-4">
        <p className="text-xs uppercase text-stone-500">Merged request</p>
        <pre className="mt-3 max-h-72 overflow-auto rounded-md bg-stone-900 p-3 text-xs text-stone-300">
          {mergedRequest}
        </pre>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={validateRequest}
          className="rounded-md bg-amber-300 px-4 py-2 text-sm font-black text-stone-950"
        >
          Run safety check
        </button>
        <span className="rounded-md border border-stone-800 px-4 py-2 text-sm text-stone-300">{status}</span>
      </div>

      <div className="rounded-lg border border-stone-800 bg-stone-950 p-4 text-sm text-stone-400">
        Run from terminal:
        <code className="ml-2 rounded bg-stone-900 px-2 py-1 text-amber-200">
          npm run test:agent -- ./test-request.json
        </code>
      </div>

      <div className="rounded-lg border border-stone-800 bg-stone-950 p-4 text-sm text-stone-400">
        <p className="font-black text-stone-200">Report and evidence folders</p>
        <div className="mt-3 grid gap-2">
          {[
            'test-results/reports/',
            'test-results/screenshots/',
            'test-results/traces/',
            'test-results/videos/'
          ].map((item) => (
            <code key={item} className="rounded bg-stone-900 px-2 py-1 text-amber-200">
              {item}
            </code>
          ))}
        </div>
      </div>
    </section>
  );
}
