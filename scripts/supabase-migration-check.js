import { existsSync, readFileSync } from 'node:fs';
import { getOutput } from './pipeline-utils.js';

const schemaPath = 'supabase/schema.sql';

const requiredTables = {
  users: ['id', 'email', 'name', 'level', 'xp', 'created_at'],
  courses: ['id', 'name', 'area', 'difficulty', 'distance', 'created_by', 'created_at'],
  course_points: ['id', 'course_id', 'lat', 'lng', 'order_index', 'type'],
  activities: ['id', 'user_id', 'course_id', 'distance', 'duration', 'xp_earned', 'created_at']
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

function main() {
  console.log('RunQuest PH Supabase migration check');
  assertSchemaFileExists();

  const schema = readFileSync(schemaPath, 'utf8');
  assertRequiredStructure(schema);
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
