import { createClient } from '@supabase/supabase-js';
import type { SupabaseVerification, TestPlan } from './types';

function getVerifierClient() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false }
  });
}

export async function verifySupabaseState(plan: TestPlan): Promise<SupabaseVerification> {
  const client = getVerifierClient();
  if (!client) {
    return {
      checked: false,
      passed: false,
      details: {},
      error: 'Supabase verification skipped because env vars are missing.'
    };
  }

  try {
    const details: Record<string, unknown> = {};

    if (String(plan.goal).toLowerCase().includes('course')) {
      const { data: courses, error } = await client
        .from('courses')
        .select('id,name,area,created_at')
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      details.latestCourses = courses ?? [];

      if (courses?.[0]?.id) {
        const { count } = await client
          .from('course_points')
          .select('*', { count: 'exact', head: true })
          .eq('course_id', courses[0].id);
        details.latestCoursePointCount = count ?? 0;
      }
    }

    if (plan.actor === 'admin') {
      const adminEmail = process.env.TEST_ADMIN_EMAIL;
      if (adminEmail) {
        const { data } = await client.from('users').select('role,status').eq('email', adminEmail).maybeSingle();
        details.adminProfile = data ?? null;
      }
    }

    return {
      checked: true,
      passed: true,
      details
    };
  } catch (error) {
    return {
      checked: true,
      passed: false,
      details: {},
      error: error instanceof Error ? error.message : 'Supabase verification failed.'
    };
  }
}
