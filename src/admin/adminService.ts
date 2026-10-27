import { supabase, requireSupabaseClient } from '../lib/supabase';
import type { Database, Json } from '../types/database';

export type AdminRole = 'admin' | 'user';
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
  const { data: userData, error: userError } = await client.auth.getUser();

  if (userError) {
    const message = userError.message.toLowerCase();
    if (message.includes('auth session missing') || message.includes('session missing')) {
      return null;
    }
    throw userError;
  }
  const authUser = userData.user;
  if (!authUser) return null;

  const { data: profileById, error: idError } = await client
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .maybeSingle();

  if (idError) throw idError;
  if (profileById) return profileById;

  if (!authUser.email) return null;

  const { data: profileByEmail, error: emailError } = await client
    .from('users')
    .select('*')
    .eq('email', authUser.email)
    .maybeSingle();

  if (emailError) throw emailError;
  if (profileByEmail) return profileByEmail;

  const { data: createdProfile, error: createError } = await client
    .from('users')
    .insert({
      id: authUser.id,
      email: authUser.email,
      name: authUser.user_metadata?.name ?? authUser.email,
      role: 'user',
      status: 'active'
    })
    .select('*')
    .single();

  if (createError) throw createError;
  return createdProfile;
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
  const results = await Promise.allSettled([
    client.from('users').select('id', { count: 'exact', head: true }),
    client.from('characters').select('id', { count: 'exact', head: true }),
    client.from('courses').select('id', { count: 'exact', head: true }),
    client.from('anti_cheat_reports').select('id', { count: 'exact', head: true }).eq('flagged', true),
    client.from('run_token_wallets').select('balance'),
    client.from('race_sessions').select('id', { count: 'exact', head: true }).eq('status', 'running'),
    client.from('guilds').select('id', { count: 'exact', head: true })
  ]);
  const safeResult = <T,>(index: number): T | null =>
    results[index].status === 'fulfilled' ? (results[index].value as T) : null;
  const users = safeResult<{ count: number | null }>(0);
  const characters = safeResult<{ count: number | null }>(1);
  const courses = safeResult<{ count: number | null }>(2);
  const flagged = safeResult<{ count: number | null }>(3);
  const wallets = safeResult<{ data: Array<{ balance: number }> | null }>(4);
  const races = safeResult<{ count: number | null }>(5);
  const guilds = safeResult<{ count: number | null }>(6);

  const walletBalance = (wallets?.data ?? []).reduce((total, wallet) => total + (wallet.balance ?? 0), 0);

  return {
    users: users?.count ?? 0,
    characters: characters?.count ?? 0,
    courses: courses?.count ?? 0,
    flaggedReports: flagged?.count ?? 0,
    tokenSupply: walletBalance,
    liveRaces: races?.count ?? 0,
    guilds: guilds?.count ?? 0
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
      setting_key: 'xp_multiplier',
      setting_value: 1,
      description: 'Global XP reward multiplier'
    },
    {
      setting_key: 'token_rate',
      setting_value: 10,
      description: 'RunToken reward rate per km'
    },
    {
      setting_key: 'reward_curve',
      setting_value: 1,
      description: 'Global reward curve tuning factor'
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
  try {
    const client = requireSupabaseClient();
    let debounceTimer: number | undefined;
    const debouncedChange = () => {
      if (typeof window === 'undefined') {
        onChange();
        return;
      }

      window.clearTimeout(debounceTimer);
      debounceTimer = window.setTimeout(onChange, 500);
    };
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
        current.on('postgres_changes', { event: '*', schema: 'public', table }, debouncedChange),
      client.channel('runquest-admin-control')
    );

    channel.subscribe((status) => {
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        console.warn('Admin realtime unavailable:', status);
      }
    });

    return () => {
      if (typeof window !== 'undefined') {
        window.clearTimeout(debounceTimer);
      }
      client.removeChannel(channel);
    };
  } catch (error) {
    console.warn('Admin realtime disabled:', error);
    return () => undefined;
  }
}

// ==============================================================================
// O2O GAME MASTER (GM) EXTENSIONS (PostGIS & Realtime Control)
// ==============================================================================

export interface GmLiveRunner {
  user_id: string;
  nickname: string;
  faction_id: string;
  faction_name: string;
  color_hex: string;
  total_xp: number;
  latitude: number;
  longitude: number;
  distance_meters?: number;
  last_active_at: string;
  pace?: string;
}

export interface GmRaidEvent {
  id: string;
  title: string;
  description: string;
  event_type: 'Raid' | 'Boss' | 'FlashMob';
  latitude: number;
  longitude: number;
  radius_meters: number;
  target_distance_km: number;
  reward_gold: number;
  reward_xp: number;
  status: 'ACTIVE' | 'COMPLETED' | 'EXPIRED';
  start_time: string;
  end_time: string;
  participants_count?: number;
}

export interface GmFactionScore {
  id: string;
  name: string;
  color_hex: string;
  current_season_score: number;
  member_count: number;
}

export interface GmAbuseLog {
  id: string;
  user_id: string;
  nickname: string;
  distance_km: number;
  duration_seconds: number;
  max_speed_kmh: number;
  avg_speed_kmh: number;
  gps_spoofing_flag: boolean;
  abuse_reason: string;
  created_at: string;
  is_banned?: boolean;
}

// Mock fallback data for instant sandbox/local testing
const MOCK_RUNNERS: GmLiveRunner[] = [
  {
    user_id: 'u-1',
    nickname: 'Makati_Striker',
    faction_id: 'makati_tigers',
    faction_name: 'Makati Tigers',
    color_hex: '#F59E0B',
    total_xp: 45200,
    latitude: 14.5573,
    longitude: 121.0232,
    last_active_at: new Date().toISOString(),
    pace: "4'55\""
  },
  {
    user_id: 'u-2',
    nickname: 'Ayala_Pacer',
    faction_id: 'makati_tigers',
    faction_name: 'Makati Tigers',
    color_hex: '#F59E0B',
    total_xp: 38100,
    latitude: 14.5585,
    longitude: 121.0215,
    last_active_at: new Date().toISOString(),
    pace: "5'12\""
  },
  {
    user_id: 'u-3',
    nickname: 'BGC_Falcon',
    faction_id: 'bgc_eagles',
    faction_name: 'BGC Eagles',
    color_hex: '#3B82F6',
    total_xp: 59300,
    latitude: 14.5204,
    longitude: 121.0504,
    last_active_at: new Date().toISOString(),
    pace: "4'30\""
  },
  {
    user_id: 'u-4',
    nickname: 'HighStreet_Runner',
    faction_id: 'bgc_eagles',
    faction_name: 'BGC Eagles',
    color_hex: '#3B82F6',
    total_xp: 42100,
    latitude: 14.5195,
    longitude: 121.0488,
    last_active_at: new Date().toISOString(),
    pace: "5'05\""
  },
  {
    user_id: 'u-5',
    nickname: 'Track30th_Ghost',
    faction_id: 'bgc_eagles',
    faction_name: 'BGC Eagles',
    color_hex: '#3B82F6',
    total_xp: 31200,
    latitude: 14.5218,
    longitude: 121.0521,
    last_active_at: new Date().toISOString(),
    pace: "4'45\""
  },
  {
    user_id: 'u-6',
    nickname: 'Salcedo_Shadow',
    faction_id: 'makati_tigers',
    faction_name: 'Makati Tigers',
    color_hex: '#F59E0B',
    total_xp: 28400,
    latitude: 14.5612,
    longitude: 121.0255,
    last_active_at: new Date().toISOString(),
    pace: "5'40\""
  }
];

let inMemoryEvents: GmRaidEvent[] = [
  {
    id: 'raid-1',
    title: 'BGC Cyber Dragon World Boss',
    description: '30-minute guild co-op run along Bonifacio High Street corridor.',
    event_type: 'Boss',
    latitude: 14.5204,
    longitude: 121.0504,
    radius_meters: 300,
    target_distance_km: 4.5,
    reward_gold: 1500,
    reward_xp: 2500,
    status: 'ACTIVE',
    start_time: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    end_time: new Date(Date.now() + 1000 * 60 * 45).toISOString(),
    participants_count: 28
  },
  {
    id: 'raid-2',
    title: 'Ayala Triangle FlashMob Sprint',
    description: 'Rapid 1.5km faction capture zone around Makati Ayala Triangle.',
    event_type: 'FlashMob',
    latitude: 14.5573,
    longitude: 121.0232,
    radius_meters: 200,
    target_distance_km: 1.5,
    reward_gold: 800,
    reward_xp: 1200,
    status: 'ACTIVE',
    start_time: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    end_time: new Date(Date.now() + 1000 * 60 * 25).toISOString(),
    participants_count: 19
  }
];

export async function getGmLiveRunners(
  centerLng: number = 121.0368,
  centerLat: number = 14.5388,
  radiusMeters: number = 10000
): Promise<GmLiveRunner[]> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = requireSupabaseClient() as any;
    const { data, error } = await client.rpc('rpc_get_active_runners_nearby', {
      p_lng: centerLng,
      p_lat: centerLat,
      p_radius_meters: radiusMeters
    });

    if (error || !data || data.length === 0) {
      return MOCK_RUNNERS;
    }

    return (data as Array<Record<string, unknown>>).map((row) => ({
      user_id: String(row.user_id),
      nickname: String(row.nickname ?? 'Runner'),
      faction_id: String(row.faction_id ?? 'unassigned'),
      faction_name: String(row.faction_name ?? 'Rogue'),
      color_hex: String(row.color_hex ?? '#94A3B8'),
      total_xp: Number(row.total_xp ?? 0),
      latitude: Number(row.latitude ?? 14.5573),
      longitude: Number(row.longitude ?? 121.0232),
      distance_meters: Number(row.distance_meters ?? 0),
      last_active_at: String(row.last_active_at ?? new Date().toISOString())
    }));
  } catch {
    return MOCK_RUNNERS;
  }
}

export async function getGmRaidEvents(): Promise<GmRaidEvent[]> {
  try {
    const client = requireSupabaseClient();
    const { data, error } = await client
      .from('events')
      .select('*')
      .order('start_time', { ascending: false });

    if (error || !data || data.length === 0) {
      return inMemoryEvents;
    }

    return (data as Array<Record<string, unknown>>).map((row) => ({
      id: String(row.id),
      title: String(row.title),
      description: String(row.description ?? ''),
      event_type: (row.event_type as GmRaidEvent['event_type']) || 'Raid',
      latitude: 14.5573,
      longitude: 121.0232,
      radius_meters: Number(row.radius_meters ?? 150),
      target_distance_km: Number(row.target_distance_km ?? 3.0),
      reward_gold: Number(row.reward_gold ?? 500),
      reward_xp: Number(row.reward_xp ?? 1000),
      status: (row.status as GmRaidEvent['status']) || 'ACTIVE',
      start_time: String(row.start_time),
      end_time: String(row.end_time),
      participants_count: 0
    }));
  } catch {
    return inMemoryEvents;
  }
}

export async function createGmRaidEvent(
  input: Omit<GmRaidEvent, 'id' | 'status' | 'participants_count'>
): Promise<GmRaidEvent> {
  const newEvent: GmRaidEvent = {
    id: `raid-${Date.now()}`,
    status: 'ACTIVE',
    participants_count: 0,
    ...input
  };

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = requireSupabaseClient() as any;
    // Insert with PostGIS geometry representation if client is available
    await client.from('events').insert({
      title: input.title,
      description: input.description,
      event_type: input.event_type,
      location_center: `SRID=4326;POINT(${input.longitude} ${input.latitude})`,
      radius_meters: input.radius_meters,
      target_distance_km: input.target_distance_km,
      reward_gold: input.reward_gold,
      reward_xp: input.reward_xp,
      start_time: input.start_time,
      end_time: input.end_time,
      status: 'ACTIVE'
    });
  } catch (err) {
    console.warn('Fallback to local storage for raid creation:', err);
  }

  inMemoryEvents = [newEvent, ...inMemoryEvents];
  return newEvent;
}

export async function getGmFactionWarScores(): Promise<GmFactionScore[]> {
  const fallbackFactions: GmFactionScore[] = [
    {
      id: 'makati_tigers',
      name: 'Makati Tigers',
      color_hex: '#F59E0B',
      current_season_score: 482500,
      member_count: 1420
    },
    {
      id: 'bgc_eagles',
      name: 'BGC Eagles',
      color_hex: '#3B82F6',
      current_season_score: 519200,
      member_count: 1580
    }
  ];

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = requireSupabaseClient() as any;
    const { data, error } = await client.from('factions').select('*');
    if (error || !data || data.length === 0) {
      return fallbackFactions;
    }
    return (data as Array<Record<string, unknown>>).map((row) => ({
      id: String(row.id),
      name: String(row.name),
      color_hex: String(row.color_hex),
      current_season_score: Number(row.current_season_score ?? 0),
      member_count: Number(row.member_count ?? 0)
    }));
  } catch {
    return fallbackFactions;
  }
}

export async function getGmAbuseLogs(): Promise<GmAbuseLog[]> {
  const fallbackLogs: GmAbuseLog[] = [
    {
      id: 'abuse-1',
      user_id: 'u-spoof-1',
      nickname: 'SpeedyGonzo99',
      distance_km: 14.8,
      duration_seconds: 300,
      max_speed_kmh: 88.5,
      avg_speed_kmh: 177.6,
      gps_spoofing_flag: true,
      abuse_reason: 'Inter-session teleportation detected (Distance: 14800m, Time: 300s, Speed: 177.6 km/h)',
      created_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
      is_banned: false
    },
    {
      id: 'abuse-2',
      user_id: 'u-spoof-2',
      nickname: 'FakeBicycleMan',
      distance_km: 5.2,
      duration_seconds: 410,
      max_speed_kmh: 52.4,
      avg_speed_kmh: 45.6,
      gps_spoofing_flag: true,
      abuse_reason: 'Abnormal running velocity (Max: 52.4 km/h, Avg: 45.6 km/h)',
      created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      is_banned: true
    }
  ];

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = requireSupabaseClient() as any;
    const { data, error } = await client
      .from('activity_logs')
      .select('*, users(nickname, is_banned)')
      .eq('gps_spoofing_flag', true)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error || !data || data.length === 0) {
      return fallbackLogs;
    }

    return (data as Array<Record<string, unknown>>).map((row) => {
      const userObj = row.users as Record<string, unknown> | undefined;
      return {
        id: String(row.id),
        user_id: String(row.user_id),
        nickname: String(userObj?.nickname ?? 'Unknown'),
        distance_km: Number(row.distance_km ?? 0),
        duration_seconds: Number(row.duration_seconds ?? 0),
        max_speed_kmh: Number(row.max_speed_kmh ?? 0),
        avg_speed_kmh: Number(row.avg_speed_kmh ?? 0),
        gps_spoofing_flag: true,
        abuse_reason: String(row.abuse_reason ?? 'Flagged by Anti-Cheat Engine'),
        created_at: String(row.created_at),
        is_banned: Boolean(userObj?.is_banned)
      };
    });
  } catch {
    return fallbackLogs;
  }
}

export async function toggleUserBan(userId: string, isBanned: boolean, reason?: string) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = requireSupabaseClient() as any;
    await client
      .from('users')
      .update({
        is_banned: isBanned,
        ban_reason: isBanned ? (reason ?? 'Banned by Game Master') : null
      })
      .eq('id', userId);
  } catch (err) {
    console.warn('User ban toggled in offline/mock context:', userId, isBanned, err);
  }
}

