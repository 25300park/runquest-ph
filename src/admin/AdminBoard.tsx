import { useEffect, useState } from 'react';
import {
  getExecutiveSnapshot,
  jsonArray,
  jsonRecord,
  subscribeToExecutiveReports,
  type ExecutiveSnapshot
} from '../services/executiveService';

const emptySnapshot: ExecutiveSnapshot = {
  kpi: null,
  board: null,
  strategy: null,
  valuation: null,
  expansion: null
};

function money(cents: number) {
  return `₱${(cents / 100).toFixed(2)}`;
}

function percent(value: unknown) {
  return `${(Number(value ?? 0) * 100).toFixed(1)}%`;
}

export default function AdminBoard() {
  const [snapshot, setSnapshot] = useState<ExecutiveSnapshot>(emptySnapshot);
  const [status, setStatus] = useState('Loading board dashboard...');

  async function loadSnapshot() {
    try {
      setSnapshot(await getExecutiveSnapshot());
      setStatus('Board dashboard live.');
    } catch (error) {
      setSnapshot(emptySnapshot);
      setStatus(error instanceof Error ? error.message : 'Board dashboard unavailable.');
    }
  }

  useEffect(() => {
    void loadSnapshot();
    const unsubscribe = subscribeToExecutiveReports(() => void loadSnapshot());
    return () => unsubscribe();
  }, []);

  const metrics = jsonRecord(snapshot.kpi?.metrics ?? {});
  const revenueTrend = jsonRecord(snapshot.board?.revenue_trend ?? {});
  const userGrowth = jsonRecord(snapshot.board?.user_growth ?? {});
  const aiInsights = jsonRecord(snapshot.board?.ai_insights ?? {});
  const recommendations = jsonArray(snapshot.strategy?.recommendations ?? []);
  const priorities = jsonArray(snapshot.strategy?.feature_priorities ?? []);
  const roadmap = jsonArray(snapshot.expansion?.expansion_roadmap ?? []);

  return (
    <section className="space-y-4">
      <div className="rounded-lg border border-stone-800 bg-stone-950 p-4">
        <p className="text-xs font-black uppercase text-amber-200">Board of Directors</p>
        <h2 className="mt-1 text-2xl font-black">Executive Operating System</h2>
        <p className="mt-2 text-sm text-stone-400">{status}</p>
      </div>

      {!snapshot.kpi && !snapshot.board ? (
        <div className="rounded-lg border border-stone-800 bg-stone-950 p-6 text-sm text-stone-400">
          No executive reports yet. Run the protected KPI generator endpoint to create auditable board data.
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['Health score', snapshot.board?.company_health_score ?? 0],
              ['MRR', money(Number(metrics.mrr_cents ?? revenueTrend.mrr_cents ?? 0))],
              ['Active users', Number(metrics.active_users ?? userGrowth.active_users ?? 0)],
              ['Conversion', percent(metrics.conversion_rate)],
              ['Churn', percent(metrics.churn_rate)],
              ['Retention', percent(metrics.retention_rate)],
              ['Runs / user', Number(metrics.runs_per_user ?? 0).toFixed(2)],
              ['Valuation', money(snapshot.valuation?.risk_adjusted_valuation_cents ?? 0)]
            ].map(([label, value]) => (
              <article key={label} className="rounded-lg border border-stone-800 bg-stone-950 p-4">
                <p className="text-xs uppercase text-stone-500">{label}</p>
                <p className="mt-2 text-2xl font-black text-amber-200">{value}</p>
              </article>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <article className="rounded-lg border border-stone-800 bg-stone-950 p-4">
              <h3 className="font-black">AI business strategist</h3>
              <p className="mt-3 text-sm leading-6 text-stone-400">
                {String(aiInsights.summary ?? snapshot.kpi?.summary ?? 'No strategic summary available.')}
              </p>
              <div className="mt-4 space-y-2">
                {recommendations.length === 0 ? (
                  <p className="text-sm text-stone-500">No recommendations generated yet.</p>
                ) : (
                  recommendations.map((item) => (
                    <p key={item} className="rounded-md bg-stone-900 p-3 text-sm text-stone-300">
                      {item}
                    </p>
                  ))
                )}
              </div>
            </article>

            <article className="rounded-lg border border-stone-800 bg-stone-950 p-4">
              <h3 className="font-black">Valuation model</h3>
              <div className="mt-4 grid gap-3 text-sm">
                <div className="rounded-md bg-stone-900 p-3">
                  <p className="text-stone-500">Estimated range</p>
                  <p className="mt-1 font-black text-amber-200">
                    {money(snapshot.valuation?.valuation_low_cents ?? 0)} -{' '}
                    {money(snapshot.valuation?.valuation_high_cents ?? 0)}
                  </p>
                </div>
                <div className="rounded-md bg-stone-900 p-3">
                  <p className="text-stone-500">ARR</p>
                  <p className="mt-1 font-black text-amber-200">{money(snapshot.valuation?.arr_cents ?? 0)}</p>
                </div>
              </div>
            </article>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <article className="rounded-lg border border-stone-800 bg-stone-950 p-4">
              <h3 className="font-black">Risk indicators</h3>
              <div className="mt-4 space-y-2">
                {jsonArray(snapshot.board?.risk_indicators ?? snapshot.kpi?.anomalies ?? []).map((item) => (
                  <p key={item} className="rounded-md bg-stone-900 p-3 text-sm text-stone-300">
                    {item}
                  </p>
                ))}
              </div>
            </article>

            <article className="rounded-lg border border-stone-800 bg-stone-950 p-4">
              <h3 className="font-black">Global expansion</h3>
              <p className="mt-3 text-sm text-stone-400">
                Recommended next market:{' '}
                <span className="font-black text-amber-200">
                  {snapshot.expansion?.recommended_next_market ?? 'Not generated'}
                </span>
              </p>
              <div className="mt-4 space-y-2">
                {roadmap.map((item) => (
                  <p key={item} className="rounded-md bg-stone-900 p-3 text-sm text-stone-300">
                    {item}
                  </p>
                ))}
              </div>
            </article>
          </div>

          <article className="rounded-lg border border-stone-800 bg-stone-950 p-4">
            <h3 className="font-black">Feature priorities</h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {priorities.length === 0 ? (
                <p className="text-sm text-stone-500">No priorities generated yet.</p>
              ) : (
                priorities.map((item) => (
                  <span key={item} className="rounded-full bg-stone-900 px-3 py-2 text-sm font-bold text-stone-300">
                    {item}
                  </span>
                ))
              )}
            </div>
          </article>
        </>
      )}
    </section>
  );
}
