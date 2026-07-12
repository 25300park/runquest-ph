import { requireSupabaseClient } from '../lib/supabase';
import type { Database, Json } from '../types/database';

export type KpiReport = Database['public']['Tables']['kpi_reports']['Row'];
export type BoardReport = Database['public']['Tables']['board_reports']['Row'];
export type BusinessStrategy = Database['public']['Tables']['ai_business_strategies']['Row'];
export type CompanyValuation = Database['public']['Tables']['company_valuations']['Row'];
export type ExpansionIntelligence = Database['public']['Tables']['global_expansion_intelligence']['Row'];

export type ExecutiveSnapshot = {
  kpi: KpiReport | null;
  board: BoardReport | null;
  strategy: BusinessStrategy | null;
  valuation: CompanyValuation | null;
  expansion: ExpansionIntelligence | null;
};

export function jsonArray(value: Json): string[] {
  return Array.isArray(value) ? value.map((item) => String(item)) : [];
}

export function jsonRecord(value: Json): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

export async function getExecutiveSnapshot(): Promise<ExecutiveSnapshot> {
  const client = requireSupabaseClient();
  const [kpiResult, boardResult, strategyResult, valuationResult, expansionResult] = await Promise.allSettled([
    client.from('kpi_reports').select('*').order('report_date', { ascending: false }).limit(1).maybeSingle(),
    client.from('board_reports').select('*').order('report_date', { ascending: false }).limit(1).maybeSingle(),
    client.from('ai_business_strategies').select('*').order('strategy_week', { ascending: false }).limit(1).maybeSingle(),
    client.from('company_valuations').select('*').order('valuation_date', { ascending: false }).limit(1).maybeSingle(),
    client
      .from('global_expansion_intelligence')
      .select('*')
      .order('report_month', { ascending: false })
      .limit(1)
      .maybeSingle()
  ]);

  return {
    kpi: kpiResult.status === 'fulfilled' ? kpiResult.value.data ?? null : null,
    board: boardResult.status === 'fulfilled' ? boardResult.value.data ?? null : null,
    strategy: strategyResult.status === 'fulfilled' ? strategyResult.value.data ?? null : null,
    valuation: valuationResult.status === 'fulfilled' ? valuationResult.value.data ?? null : null,
    expansion: expansionResult.status === 'fulfilled' ? expansionResult.value.data ?? null : null
  };
}

export function subscribeToExecutiveReports(onChange: () => void) {
  const client = requireSupabaseClient();
  let debounceTimer: number | undefined;
  const debounced = () => {
    window.clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(onChange, 500);
  };
  const channel = client
    .channel('executive-board')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'kpi_reports' }, debounced)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'board_reports' }, debounced)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'ai_business_strategies' }, debounced)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'company_valuations' }, debounced)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'global_expansion_intelligence' }, debounced)
    .subscribe();

  return () => {
    window.clearTimeout(debounceTimer);
    client.removeChannel(channel);
  };
}
