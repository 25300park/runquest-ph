import { useEffect, useState } from 'react';
import {
  getEnterpriseBillingSummary,
  getFinancialRiskLogs,
  getInvestorMetrics,
  getRevenueOptimization,
  type InvestorMetrics
} from '../services/financialOpsService';

const emptyMetrics: InvestorMetrics = {
  mrrCents: 0,
  arrCents: 0,
  cacCents: 0,
  ltvCents: 0,
  churnRate: 0,
  activeUsers: 0,
  growthRate: 0,
  activePremiumUsers: 0,
  enterpriseAccounts: 0,
  highRiskPayments: 0,
  monthlyTrend: []
};

function money(cents: number) {
  return `₱${(cents / 100).toFixed(2)}`;
}

function percent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

export default function AdminInvestor() {
  const [metrics, setMetrics] = useState<InvestorMetrics>(emptyMetrics);
  const [riskLogs, setRiskLogs] = useState<Array<{ id: string; risk_level: string; fraud_score: number; action: string }>>([]);
  const [enterprise, setEnterprise] = useState({ accounts: 0, invoices: 0 });
  const [optimization, setOptimization] = useState<string>('Loading AI revenue strategy...');
  const [status, setStatus] = useState('Loading investor dashboard...');

  async function loadDashboard() {
    try {
      const [nextMetrics, risks, billing, aiPlan] = await Promise.all([
        getInvestorMetrics(),
        getFinancialRiskLogs(),
        getEnterpriseBillingSummary(),
        getRevenueOptimization()
      ]);
      setMetrics(nextMetrics);
      setRiskLogs(risks);
      setEnterprise({ accounts: billing.accounts.length, invoices: billing.invoices.length });
      setOptimization(aiPlan?.retention_strategy ?? 'No recommendation available yet.');
      setStatus('Investor dashboard live.');
    } catch (error) {
      setMetrics(emptyMetrics);
      setStatus(error instanceof Error ? error.message : 'Investor dashboard unavailable.');
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, []);

  function exportReport() {
    const report = {
      generatedAt: new Date().toISOString(),
      metrics,
      riskLogs,
      enterprise,
      optimization
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `runquest-investor-report-${Date.now()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="space-y-4">
      <div className="rounded-lg border border-stone-800 bg-stone-950 p-4">
        <p className="text-xs font-black uppercase text-amber-200">Investor control</p>
        <h2 className="mt-1 text-2xl font-black">Financial Infrastructure Dashboard</h2>
        <p className="mt-2 text-sm text-stone-400">{status}</p>
        <button
          type="button"
          onClick={exportReport}
          className="mt-4 rounded-md bg-amber-300 px-4 py-2 text-sm font-black text-stone-950"
        >
          Export report
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['MRR', money(metrics.mrrCents)],
          ['ARR', money(metrics.arrCents)],
          ['CAC', money(metrics.cacCents)],
          ['LTV', money(metrics.ltvCents)],
          ['Churn', percent(metrics.churnRate)],
          ['Active users', metrics.activeUsers],
          ['Growth', percent(metrics.growthRate)],
          ['High risk payments', metrics.highRiskPayments]
        ].map(([label, value]) => (
          <article key={label} className="rounded-lg border border-stone-800 bg-stone-950 p-4">
            <p className="text-xs uppercase text-stone-500">{label}</p>
            <p className="mt-2 text-2xl font-black text-amber-200">{value}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-lg border border-stone-800 bg-stone-950 p-4">
          <h3 className="font-black">Revenue trend</h3>
          <div className="mt-4 space-y-3">
            {metrics.monthlyTrend.length === 0 ? (
              <p className="text-sm text-stone-500">No revenue trend yet.</p>
            ) : (
              metrics.monthlyTrend.map((item) => {
                const max = Math.max(...metrics.monthlyTrend.map((trend) => trend.revenueCents), 1);
                return (
                  <div key={item.label}>
                    <div className="flex justify-between text-xs text-stone-400">
                      <span>{item.label}</span>
                      <span>{money(item.revenueCents)}</span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-stone-800">
                      <div
                        className="h-full rounded-full bg-quest-teal"
                        style={{ width: `${Math.max(4, (item.revenueCents / max) * 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </article>

        <article className="rounded-lg border border-stone-800 bg-stone-950 p-4">
          <h3 className="font-black">AI revenue optimization</h3>
          <p className="mt-3 text-sm leading-6 text-stone-400">{optimization}</p>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-md bg-stone-900 p-3">
              <p className="text-stone-500">Premium users</p>
              <p className="mt-1 font-black text-amber-200">{metrics.activePremiumUsers}</p>
            </div>
            <div className="rounded-md bg-stone-900 p-3">
              <p className="text-stone-500">Enterprise accounts</p>
              <p className="mt-1 font-black text-amber-200">{enterprise.accounts}</p>
            </div>
          </div>
        </article>
      </div>

      <article className="rounded-lg border border-stone-800 bg-stone-950 p-4">
        <h3 className="font-black">Payment fraud monitor</h3>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="text-xs uppercase text-stone-500">
              <tr>
                <th className="py-2">Risk</th>
                <th className="py-2">Score</th>
                <th className="py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {riskLogs.length === 0 ? (
                <tr>
                  <td className="py-3 text-stone-500" colSpan={3}>
                    No suspicious payment logs.
                  </td>
                </tr>
              ) : (
                riskLogs.map((log) => (
                  <tr key={log.id} className="border-t border-stone-800">
                    <td className="py-3 font-bold">{log.risk_level}</td>
                    <td className="py-3">{log.fraud_score}</td>
                    <td className="py-3">{log.action}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
