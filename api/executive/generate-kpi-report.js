function readEnv(name) {
  return process.env[name] ?? '';
}

function isAuthorized(request) {
  const secret = readEnv('ADMIN_SECRET');
  if (!secret) return false;
  return request.headers.authorization === `Bearer ${secret}` || request.headers['x-admin-secret'] === secret;
}

function supabaseConfig() {
  const url = readEnv('SUPABASE_URL') || readEnv('VITE_SUPABASE_URL');
  const serviceKey = readEnv('SUPABASE_SERVICE_ROLE_KEY');

  if (!url || !serviceKey) {
    throw new Error('Supabase service role is not configured.');
  }

  return { url, serviceKey };
}

async function supabaseFetch(path, init = {}) {
  const { url, serviceKey } = supabaseConfig();
  const result = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {})
    }
  });

  if (!result.ok) {
    throw new Error(`Supabase request failed: ${result.status}`);
  }

  if (result.status === 204) return null;
  return result.json();
}

function monthKey(date) {
  const value = new Date(date);
  return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, '0')}`;
}

function reportPeriod() {
  const today = new Date();
  const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

function anomalySummary(metrics) {
  const issues = [];
  if (metrics.churn_rate > 0.25) issues.push('High churn pressure');
  if (metrics.conversion_rate < 0.03 && metrics.active_users > 20) issues.push('Low premium conversion');
  if (metrics.runs_per_user < 0.25 && metrics.active_users > 10) issues.push('Low run engagement');
  if (metrics.mrr_cents === 0 && metrics.active_users > 10) issues.push('Revenue not yet activated');
  return issues.length ? issues : ['No material anomaly detected'];
}

function strategicSummary(metrics) {
  if (metrics.mrr_growth_rate > 0.2) {
    return 'Growth is accelerating. Prioritize retention and premium conversion experiments.';
  }
  if (metrics.churn_rate > 0.25) {
    return 'Churn is the main operating risk. Prioritize renewal reminders and AI coach value proof.';
  }
  if (metrics.runs_per_user < 0.5) {
    return 'Engagement is the main operating gap. Prioritize route completion loops and weekly events.';
  }
  return 'Core health is stable. Continue compounding routes, premium pass value, and local partnerships.';
}

function valuation(metrics) {
  const arr = metrics.mrr_cents * 12;
  const growthMultiplier = metrics.mrr_growth_rate > 0.2 ? 8 : metrics.mrr_growth_rate > 0 ? 5 : 3;
  const churnDiscount = metrics.churn_rate > 0.25 ? 0.65 : metrics.churn_rate > 0.1 ? 0.85 : 1;
  const engagementBonus = Math.min(1.25, 1 + metrics.runs_per_user / 20);
  const base = arr * growthMultiplier * churnDiscount * engagementBonus;
  return {
    low_cents: Math.round(base * 0.75),
    high_cents: Math.round(base * 1.4),
    risk_adjusted_cents: Math.round(base),
    assumptions: {
      arr_cents: arr,
      growth_multiplier: growthMultiplier,
      churn_discount: churnDiscount,
      engagement_bonus: engagementBonus
    }
  };
}

function expansion(metrics, leaderboard) {
  const regions = ['Philippines', 'Korea', 'Global'].map((region) => {
    const rows = leaderboard.filter((row) => row.region === region);
    const score = rows.reduce((sum, row) => sum + (row.weekly_score ?? 0), 0);
    const users = new Set(rows.map((row) => row.user_id).filter(Boolean)).size;
    return {
      region,
      score,
      users,
      readiness: region === 'Philippines' ? 90 : Math.min(80, 35 + users * 5 + score / 1000)
    };
  });
  const priority = [...regions].sort((a, b) => b.readiness - a.readiness);
  const nextMarket = priority.find((region) => region.region !== 'Philippines') ?? priority[0];
  return {
    roadmap: ['Philippines retention base', 'Korea pilot routes', 'SEA city partner tests', 'Global challenge layer'],
    priority_countries: priority,
    next_market: nextMarket.region,
    expected_revenue_impact_cents: Math.round(metrics.mrr_cents * (nextMarket.readiness / 100) * 0.4)
  };
}

export default async function handler(request, response) {
  if (!['POST', 'GET'].includes(request.method ?? '')) {
    response.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (!isAuthorized(request)) {
    response.status(401).json({ error: 'Admin secret required.' });
    return;
  }

  try {
    const { start, end } = reportPeriod();
    const [users, revenue, passes, activities, leaderboard] = await Promise.all([
      supabaseFetch('users?select=*'),
      supabaseFetch('revenue_events?select=*&order=occurred_at.desc&limit=1000'),
      supabaseFetch('premium_passes?select=*&order=created_at.desc&limit=1000'),
      supabaseFetch('activities?select=*&order=created_at.desc&limit=1000'),
      supabaseFetch('leaderboard_global?select=*&order=updated_at.desc&limit=1000')
    ]);
    const activeUsers = users.filter((user) => user.status === 'active').length;
    const activePremium = users.filter((user) => {
      const expiry = user.premium_expires_at ? new Date(user.premium_expires_at).getTime() : 0;
      return user.subscription_type === 'premium' && user.subscription_status === 'active' && expiry > Date.now();
    }).length;
    const currentMonth = revenue.filter((event) => monthKey(event.occurred_at) === monthKey(start.toISOString()));
    const previousMonthDate = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() - 1, 1));
    const previousMonth = revenue.filter((event) => monthKey(event.occurred_at) === monthKey(previousMonthDate.toISOString()));
    const mrrCents = currentMonth.reduce((sum, event) => sum + event.amount_cents, 0);
    const previousMrr = previousMonth.reduce((sum, event) => sum + event.amount_cents, 0);
    const expiredPasses = passes.filter((pass) => pass.status !== 'active').length;
    const uniqueRunners = new Set(activities.map((activity) => activity.user_id).filter(Boolean)).size;
    const metrics = {
      active_users: activeUsers,
      mrr_cents: mrrCents,
      churn_rate: passes.length > 0 ? expiredPasses / passes.length : 0,
      retention_rate: passes.length > 0 ? 1 - expiredPasses / passes.length : 1,
      runs_per_user: activeUsers > 0 ? activities.length / activeUsers : 0,
      conversion_rate: activeUsers > 0 ? activePremium / activeUsers : 0,
      mrr_growth_rate: previousMrr > 0 ? (mrrCents - previousMrr) / previousMrr : 0,
      unique_runners: uniqueRunners
    };
    const anomalies = anomalySummary(metrics);
    const summary = strategicSummary(metrics);
    const [kpiReport] = await supabaseFetch('kpi_reports', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        report_date: start.toISOString().slice(0, 10),
        period: 'daily',
        metrics,
        summary,
        anomalies,
        source: 'executive-generator'
      })
    });
    const [boardReport] = await supabaseFetch('board_reports', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        report_date: start.toISOString().slice(0, 10),
        company_health_score: Math.round(
          Math.max(0, Math.min(100, 55 + metrics.conversion_rate * 100 - metrics.churn_rate * 50 + metrics.runs_per_user))
        ),
        revenue_trend: { mrr_cents: mrrCents, previous_mrr_cents: previousMrr },
        user_growth: { active_users: activeUsers, unique_runners: uniqueRunners },
        risk_indicators: anomalies,
        ai_insights: { summary, recommendation: strategicSummary(metrics) }
      })
    });
    const valuationResult = valuation(metrics);
    const [valuationRow] = await supabaseFetch('company_valuations', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        valuation_date: start.toISOString().slice(0, 10),
        arr_cents: metrics.mrr_cents * 12,
        mrr_growth_rate: metrics.mrr_growth_rate,
        churn_rate: metrics.churn_rate,
        user_growth_rate: metrics.unique_runners > 0 ? metrics.active_users / metrics.unique_runners : 0,
        engagement_score: Math.min(100, metrics.runs_per_user * 10),
        valuation_low_cents: valuationResult.low_cents,
        valuation_high_cents: valuationResult.high_cents,
        risk_adjusted_valuation_cents: valuationResult.risk_adjusted_cents,
        assumptions: valuationResult.assumptions
      })
    });
    const expansionResult = expansion(metrics, leaderboard);
    const [expansionRow] = await supabaseFetch('global_expansion_intelligence', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        report_month: start.toISOString().slice(0, 7),
        top_regions: expansionResult.priority_countries,
        recommended_next_market: expansionResult.next_market,
        localization_readiness: expansionResult.priority_countries,
        demand_prediction: { expected_revenue_impact_cents: expansionResult.expected_revenue_impact_cents },
        expansion_roadmap: expansionResult.roadmap,
        expected_revenue_impact_cents: expansionResult.expected_revenue_impact_cents
      })
    });

    await supabaseFetch('ai_business_strategies', {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({
        strategy_week: start.toISOString().slice(0, 10),
        input_hash: `${kpiReport.id}-${boardReport.id}`,
        recommendations: [
          summary,
          metrics.conversion_rate < 0.05 ? 'Increase Premium Pass value preview after quest completion.' : 'Scale premium messaging through guild bonuses.',
          metrics.churn_rate > 0.2 ? 'Trigger renewal reminder 3 days before pass expiry.' : 'Maintain current renewal cadence.'
        ],
        pricing_adjustments: { premium_pass_php: metrics.churn_rate > 0.2 ? 129 : 149 },
        feature_priorities: ['AI coach value proof', 'Premium route unlocks', 'Guild bonus loops'],
        growth_strategies: expansionResult.roadmap,
        explainability: {
          source_tables: ['users', 'revenue_events', 'premium_passes', 'activities', 'leaderboard_global'],
          anomalies
        }
      })
    });

    response.status(200).json({
      status: 'ok',
      kpiReport,
      boardReport,
      valuation: valuationRow,
      expansion: expansionRow,
      generatedUntil: end.toISOString()
    });
  } catch (error) {
    response.status(500).json({ error: error instanceof Error ? error.message : 'Executive report generation failed.' });
  }
}
