import { supabase, requireSupabaseClient } from '../lib/supabase';
import type { Database, Json } from '../types/database';

export type AdminRole = 'admin' | 'moderator' | 'user';
export type AdminUser = Database['public']['Tables']['users']['Row'];
export type AdminCharacter = Database['public']['Tables']['characters']['Row'];
export type AdminCourse = Database['public']['Tables']['courses']['Row'];
export type AdminItem = Database['public']['Tables']['equipment_items']['Row'];
export type AdminCheatReport = Database['public']['Tables']['anti_cheat_reports']['Row'];
export type AdminEconomySetting = Database['public']['Tables']['system_settings']['Row'];
export type AdminCoursePoint = Database['public']['Tables']['course_points']['Row'];

async function getAdminUserId() {
  const profile = await getCurrentAdminProfile();
  return profile?.id ?? null;
}

export async function signInAdmin(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;

  const profile = await getCurrentAdminProfile();
  if (!profile || profile.role !== 'admin' || profile.status !== 'active') {
    await supabase.auth.signOut();
    throw new Error('Admin access required.');
  }

  return profile;
}

export async function signOutAdmin() {
  await supabase.auth.signOut();
}

export async function getCurrentAdminProfile() {
  const client = requireSupabaseClient();
  const { data: sessionData, error: sessionError } = await client.auth.getSession();

  if (sessionError) throw sessionError;
  const userId = sessionData.session?.user.id;
  if (!userId) return null;

  const { data, error } = await client
    .from('users')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function logAdminAction(input: {
  adminUserId?: string | null;
  action: string;
  targetTable: string;
  targetId?: string | null;
  metadata?: Json;
}) {
  const client = requireSupabaseClient();
  const { error } = await client.from('admin_audit_logs').insert({
    admin_user_id: input.adminUserId ?? null,
    action: input.action,
    target_table: input.targetTable,
    target_id: input.targetId ?? null,
    metadata: input.metadata ?? {}
  });

  if (error) throw error;
}

export async function getAdminDashboardStats() {
  const client = requireSupabaseClient();
  const [
    users,
    characters,
    courses,
    flagged,
    wallets,
    races,
    guilds
  ] = await Promise.all([
    client.from('users').select('id', { count: 'exact', head: true }),
    client.from('characters').select('id', { count: 'exact', head: true }),
    client.from('courses').select('id', { count: 'exact', head: true }),
    client.from('anti_cheat_reports').select('id', { count: 'exact', head: true }).eq('flagged', true),
    client.from('run_token_wallets').select('balance'),
    client.from('race_sessions').select('id', { count: 'exact', head: true }).eq('status', 'running'),
    client.from('guilds').select('id', { count: 'exact', head: true })
  ]);

  const walletBalance = (wallets.data ?? []).reduce((total, wallet) => total + wallet.balance, 0);

  return {
    users: users.count ?? 0,
    characters: characters.count ?? 0,
    courses: courses.count ?? 0,
    flaggedReports: flagged.count ?? 0,
    tokenSupply: walletBalance,
    liveRaces: races.count ?? 0,
    guilds: guilds.count ?? 0
  };
}

export async function listAdminUsers() {
  const client = requireSupabaseClient();
  const { data, error } = await client
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function updateUserRole(userId: string, role: AdminRole) {
  const client = requireSupabaseClient();
  const { data, error } = await client
    .from('users')
    .update({ role })
    .eq('id', userId)
    .select('*')
    .single();

  if (error) throw error;
  await logAdminAction({
    adminUserId: await getAdminUserId(),
    action: 'update_user_role',
    targetTable: 'users',
    targetId: userId,
    metadata: { role }
  });
  return data;
}

export async function updateUserStatus(
  userId: string,
  status: Database['public']['Tables']['users']['Row']['status']
) {
  const client = requireSupabaseClient();
  const { data, error } = await client
    .from('users')
    .update({ status })
    .eq('id', userId)
    .select('*')
    .single();

  if (error) throw error;
  await logAdminAction({
    adminUserId: await getAdminUserId(),
    action: 'update_user_status',
    targetTable: 'users',
    targetId: userId,
    metadata: { status }
  });
  return data;
}

export async function listAdminCharacters() {
  const client = requireSupabaseClient();
  const { data, error } = await client
    .from('characters')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function updateCharacterProgress(characterId: string, input: { level: number; xp: number }) {
  const client = requireSupabaseClient();
  const { data, error } = await client
    .from('characters')
    .update({ level: input.level, xp: input.xp })
    .eq('id', characterId)
    .select('*')
    .single();

  if (error) throw error;
  await logAdminAction({
    adminUserId: await getAdminUserId(),
    action: 'update_character_progress',
    targetTable: 'characters',
    targetId: characterId,
    metadata: input
  });
  return data;
}

export async function resetCharacterAvatar(characterId: string) {
  const client = requireSupabaseClient();
  const { data, error } = await client
    .from('characters')
    .update({ avatar_base_url: null })
    .eq('id', characterId)
    .select('*')
    .single();

  if (error) throw error;
  await logAdminAction({
    adminUserId: await getAdminUserId(),
    action: 'reset_character_avatar',
    targetTable: 'characters',
    targetId: characterId
  });
  return data;
}

export async function updateCharacterStatus(
  characterId: string,
  status: AdminCharacter['status']
) {
  const client = requireSupabaseClient();
  const { data, error } = await client
    .from('characters')
    .update({ status })
    .eq('id', characterId)
    .select('*')
    .single();

  if (error) throw error;
  await logAdminAction({
    adminUserId: await getAdminUserId(),
    action: 'update_character_status',
    targetTable: 'characters',
    targetId: characterId,
    metadata: { status }
  });
  return data;
}

export function banCharacter(characterId: string) {
  return updateCharacterStatus(characterId, 'banned');
}

export async function assignEquipment(characterId: string, itemId: string) {
  const client = requireSupabaseClient();
  const { data, error } = await client
    .from('character_equipment')
    .insert({ character_id: characterId, item_id: itemId, equipped: false })
    .select('*')
    .single();

  if (error) throw error;
  await logAdminAction({
    adminUserId: await getAdminUserId(),
    action: 'assign_equipment',
    targetTable: 'character_equipment',
    targetId: data.id,
    metadata: { characterId, itemId }
  });
  return data;
}

export async function listCharacterEquipment(characterId: string) {
  const client = requireSupabaseClient();
  const { data, error } = await client
    .from('character_equipment')
    .select('*')
    .eq('character_id', characterId);

  if (error) throw error;
  return data ?? [];
}

export async function removeCharacterEquipment(equipmentId: string) {
  const client = requireSupabaseClient();
  const { error } = await client.from('character_equipment').delete().eq('id', equipmentId);

  if (error) throw error;
  await logAdminAction({
    adminUserId: await getAdminUserId(),
    action: 'remove_equipment',
    targetTable: 'character_equipment',
    targetId: equipmentId
  });
}

export async function listAdminCourses() {
  const client = requireSupabaseClient();
  const { data, error } = await client
    .from('courses')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function listAdminCoursePoints(courseId: string) {
  const client = requireSupabaseClient();
  const { data, error } = await client
    .from('course_points')
    .select('*')
    .eq('course_id', courseId)
    .order('order_index', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function updateAdminCourseName(courseId: string, name: string) {
  const client = requireSupabaseClient();
  const { data, error } = await client
    .from('courses')
    .update({ name })
    .eq('id', courseId)
    .select('*')
    .single();

  if (error) throw error;
  await logAdminAction({
    adminUserId: await getAdminUserId(),
    action: 'update_course_name',
    targetTable: 'courses',
    targetId: courseId,
    metadata: { name }
  });
  return data;
}

export async function replaceAdminCoursePoints(courseId: string, points: Array<{ lat: number; lng: number }>) {
  const client = requireSupabaseClient();
  const { error: deleteError } = await client.from('course_points').delete().eq('course_id', courseId);

  if (deleteError) throw deleteError;

  if (points.length > 0) {
    const { error: insertError } = await client.from('course_points').insert(
      points.map((point, index) => ({
        course_id: courseId,
        lat: point.lat,
        lng: point.lng,
        order_index: index,
        type: index === 0 ? 'start' : index === points.length - 1 ? 'finish' : 'checkpoint'
      }))
    );

    if (insertError) throw insertError;
  }

  await logAdminAction({
    adminUserId: await getAdminUserId(),
    action: 'replace_course_points',
    targetTable: 'course_points',
    targetId: courseId,
    metadata: { point_count: points.length }
  });
}

export async function deleteAdminCourse(courseId: string) {
  const client = requireSupabaseClient();
  const { error } = await client.from('courses').delete().eq('id', courseId);

  if (error) throw error;
  await logAdminAction({
    adminUserId: await getAdminUserId(),
    action: 'delete_course',
    targetTable: 'courses',
    targetId: courseId
  });
}

export async function updateCourseModeration(
  courseId: string,
  input: { status: AdminCourse['status']; verified?: boolean }
) {
  const client = requireSupabaseClient();
  const { data, error } = await client
    .from('courses')
    .update({ status: input.status, verified: input.verified ?? input.status === 'approved' })
    .eq('id', courseId)
    .select('*')
    .single();

  if (error) throw error;
  await logAdminAction({
    adminUserId: await getAdminUserId(),
    action: 'moderate_course',
    targetTable: 'courses',
    targetId: courseId,
    metadata: input
  });
  return data;
}

export async function deleteInvalidCourse(courseId: string) {
  return updateCourseModeration(courseId, { status: 'deleted', verified: false });
}

export async function listEconomyItems() {
  const client = requireSupabaseClient();
  const { data, error } = await client
    .from('equipment_items')
    .select('*')
    .order('rarity', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function updateEconomyItem(
  itemId: string,
  input: { tokenPrice: number; dropRate: number; xpBonus: number; speedBonus: number }
) {
  const client = requireSupabaseClient();
  const { data, error } = await client
    .from('equipment_items')
    .update({
      token_price: input.tokenPrice,
      drop_rate: input.dropRate,
      xp_bonus: input.xpBonus,
      speed_bonus: input.speedBonus
    })
    .eq('id', itemId)
    .select('*')
    .single();

  if (error) throw error;
  await logAdminAction({
    adminUserId: await getAdminUserId(),
    action: 'update_economy_item',
    targetTable: 'equipment_items',
    targetId: itemId,
    metadata: input
  });
  return data;
}

export async function listEconomySettings() {
  const client = requireSupabaseClient();
  const defaults: Array<Database['public']['Tables']['system_settings']['Insert']> = [
    {
      setting_key: 'xp_reward_rate',
      setting_value: 1,
      description: 'Global XP reward multiplier'
    },
    {
      setting_key: 'token_reward_multiplier',
      setting_value: 1,
      description: 'Global RunToken reward multiplier'
    },
  ];
  const { data: existing, error: existingError } = await client
    .from('system_settings')
    .select('*');

  if (existingError) throw existingError;

  const existingKeys = new Set((existing ?? []).map((setting) => setting.setting_key));
  const missing = defaults.filter((setting) => !existingKeys.has(setting.setting_key));

  if (missing.length > 0) {
    const { error } = await client.from('system_settings').insert(missing);
    if (error) throw error;
  }

  const { data, error } = await client
    .from('system_settings')
    .select('*')
    .order('setting_key', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function updateEconomySetting(settingId: string, value: number) {
  const client = requireSupabaseClient();
  const adminUserId = await getAdminUserId();
  const { data, error } = await client
    .from('system_settings')
    .update({
      setting_value: value,
      updated_by: adminUserId,
      updated_at: new Date().toISOString()
    })
    .eq('id', settingId)
    .select('*')
    .single();

  if (error) throw error;
  await logAdminAction({
    adminUserId,
    action: 'update_economy_setting',
    targetTable: 'system_settings',
    targetId: settingId,
    metadata: { setting_key: data.setting_key, setting_value: value }
  });
  return data;
}

export async function listCheatReports() {
  const client = requireSupabaseClient();
  const { data, error } = await client
    .from('anti_cheat_reports')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function listFlaggedSessions() {
  const client = requireSupabaseClient();
  const { data, error } = await client
    .from('flagged_sessions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export function subscribeToAdminRealtime(onChange: () => void) {
  const client = requireSupabaseClient();
  const tables = [
    'users',
    'characters',
    'courses',
    'anti_cheat_reports',
    'flagged_sessions',
    'run_token_wallets',
    'system_settings',
    'leaderboard',
    'guilds',
    'race_sessions'
  ];
  const channel = tables.reduce(
    (current, table) =>
      current.on('postgres_changes', { event: '*', schema: 'public', table }, onChange),
    client.channel('runquest-admin-control')
  );

  channel.subscribe();

  return () => {
    client.removeChannel(channel);
  };
}
