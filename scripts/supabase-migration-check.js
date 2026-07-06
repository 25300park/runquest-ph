import { existsSync, readFileSync } from 'node:fs';
import { getOutput } from './pipeline-utils.js';

const schemaPath = 'supabase/schema.sql';

const requiredTables = {
  users: ['id', 'email', 'name', 'level', 'xp', 'subscription_type', 'referral_code', 'created_at'],
  courses: ['id', 'name', 'area', 'difficulty', 'distance', 'created_by', 'created_at'],
  course_points: ['id', 'course_id', 'lat', 'lng', 'order_index', 'type'],
  activities: ['id', 'user_id', 'course_id', 'distance', 'duration', 'xp_earned', 'created_at'],
  leaderboard: ['id', 'user_id', 'character_id', 'region', 'weekly_score'],
  guilds: ['id', 'name', 'leader_id', 'shared_xp', 'total_xp', 'total_distance'],
  guild_members: ['id', 'guild_id', 'user_id', 'character_id', 'role', 'contribution_score'],
  guild_scores: ['id', 'guild_id', 'week_start', 'rank_score'],
  referrals: ['id', 'referrer_user_id', 'referred_user_id', 'referral_code', 'status'],
  push_subscriptions: ['id', 'user_id', 'endpoint', 'permission'],
  events: ['id', 'season_id', 'name', 'event_type', 'xp_bonus_multiplier'],
  season_scores: ['id', 'season_id', 'user_id', 'character_id', 'rank_score'],
  migration_history: ['id', 'change_type', 'executed_at', 'status']
};

const destructivePatterns = [
  /\bdrop\s+table\b/i,
  /\bdrop\s+column\b/i,
  /\btruncate\s+table\b/i,
  /\bdelete\s+from\b/i,
  /\balter\s+table\b[\s\S]*\bdrop\b/i
];

function assertSchemaFileExists() {
  if (!existsSync(schemaPath)) {
    throw new Error(`Missing Supabase schema file: ${schemaPath}`);
  }
}

function assertRequiredStructure(schema) {
  const lowerSchema = schema.toLowerCase();

  for (const [table, columns] of Object.entries(requiredTables)) {
    if (!lowerSchema.includes(`create table if not exists public.${table}`)) {
      throw new Error(`Missing required table: public.${table}`);
    }

    for (const column of columns) {
      const tableStart = lowerSchema.indexOf(`create table if not exists public.${table}`);
      const nextTable = lowerSchema.indexOf('create table if not exists public.', tableStart + 1);
      const tableBlock = lowerSchema.slice(tableStart, nextTable === -1 ? undefined : nextTable);

      if (!tableBlock.includes(column.toLowerCase())) {
        throw new Error(`Missing required column: public.${table}.${column}`);
      }
    }
  }
}

function assertNoDestructiveSchemaDiff() {
  const changedFiles = getOutput('git', ['diff', '--name-only', 'HEAD'])
    .split(/\r?\n/)
    .filter(Boolean);

  const schemaChanged = changedFiles.some((filePath) => filePath === schemaPath);

  if (!schemaChanged) {
    console.log('No working-tree Supabase schema diff detected.');
    return;
  }

  const diff = getOutput('git', ['diff', 'HEAD', '--', schemaPath]);
  const dangerousLines = diff
    .split(/\r?\n/)
    .filter((line) => line.startsWith('+') && !line.startsWith('+++'))
    .filter((line) => destructivePatterns.some((pattern) => pattern.test(line)));

  if (dangerousLines.length > 0) {
    console.warn('\nDestructive Supabase migration changes detected:');
    for (const line of dangerousLines) {
      console.warn(line);
    }

    throw new Error('Migration check stopped deployment because destructive SQL was detected.');
  }
}

function assertRlsEnabled(schema) {
  const lowerSchema = schema.toLowerCase();

  for (const table of Object.keys(requiredTables)) {
    const rlsStatement = `alter table public.${table} enable row level security`;
    if (!lowerSchema.includes(rlsStatement)) {
      throw new Error(`Missing RLS enable statement for public.${table}`);
    }
  }
}

function logAlterTableOperations(schema) {
  const operations = schema
    .split(/\r?\n/)
    .filter((line) => /^\s*alter\s+table\s+/i.test(line));

  console.log(`Tracked ALTER TABLE operations: ${operations.length}`);
  operations.forEach((operation) => console.log(`- ${operation.trim()}`));
}

function main() {
  console.log('RunQuest PH Supabase migration check');
  assertSchemaFileExists();

  const schema = readFileSync(schemaPath, 'utf8');
  assertRequiredStructure(schema);
  assertRlsEnabled(schema);
  logAlterTableOperations(schema);
  assertNoDestructiveSchemaDiff();

  console.log('Supabase migration check passed.');
}

try {
  main();
} catch (error) {
  console.error('\nSupabase migration check failed.');
  console.error(error.message);
  process.exitCode = 1;
}
