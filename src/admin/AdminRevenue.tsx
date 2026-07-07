import { useEffect, useState } from 'react';
import { getRevenueMetrics, subscribeToRevenue, type RevenueMetrics } from '../services/revenueService';

const emptyMetrics: RevenueMetrics = {
  mrrCents: 0,
  totalRevenueCents: 0,
  dailySalesCents: 0,
  totalSubscribers: 0,
  activeSubscribers: 0,
  churnRate: 0,
  conversionRate: 0,
  growthRate: 0
};

function money(cents: number) {
  return `₱${(cents / 100).toFixed(2)}`;
}

function percent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

export default function AdminRevenue() {
  const [metrics, setMetrics] = useState<RevenueMetrics>(emptyMetrics);
  const [status, setStatus] = useState('Loading revenue analytics...');

  async function loadMetrics() {
    try {
      setMetrics(await getRevenueMetrics());
      setStatus('Revenue analytics live.');
    } catch (error) {
      setMetrics(emptyMetrics);
      setStatus(error instanceof Error ? error.message : 'Revenue analytics unavailable.');
    }
  }

  useEffect(() => {
    void loadMetrics();
    const unsubscribe = subscribeToRevenue(() => void loadMetrics());
    return () => unsubscribe();
  }, []);

  return (
    <section className="space-y-4">
      <div className="rounded-lg border border-stone-800 bg-stone-950 p-4">
        <p className="text-xs font-black uppercase text-amber-200">Revenue control</p>
        <h2 className="mt-1 text-2xl font-black">Premium Pass Analytics</h2>
        <p className="mt-2 text-sm text-stone-400">{status}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[
          ['Total revenue', money(metrics.totalRevenueCents)],
          ['Daily sales', money(metrics.dailySalesCents)],
          ['Monthly pass revenue', money(metrics.mrrCents)],
          ['Total pass buyers', metrics.totalSubscribers],
          ['Active premium users', metrics.activeSubscribers],
          ['Expired or cancelled rate', percent(metrics.churnRate)],
          ['Conversion rate', percent(metrics.conversionRate)],
          ['Growth rate', percent(metrics.growthRate)]
        ].map(([label, value]) => (
          <article key={label} className="rounded-lg border border-stone-800 bg-stone-950 p-4">
            <p className="text-xs uppercase text-stone-500">{label}</p>
            <p className="mt-2 text-2xl font-black text-amber-200">{value}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
