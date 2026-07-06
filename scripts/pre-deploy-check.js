import { readEnvValue, npmCommand, runChecked } from './pipeline-utils.js';

const requiredEnvVars = [
  ['VITE_SUPABASE_URL', 'SUPABASE_URL'],
  ['VITE_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY'],
  ['ADMIN_SECRET']
];

function checkEnv() {
  console.log('\nChecking required environment variables...');
  const missing = requiredEnvVars
    .filter((keys) => !keys.some((key) => readEnvValue(key)))
    .map((keys) => keys.join(' or '));

  if (missing.length > 0) {
    throw new Error(`Missing required env variables: ${missing.join(', ')}`);
  }

  const supabaseUrl = readEnvValue('VITE_SUPABASE_URL') || readEnvValue('SUPABASE_URL');
  const supabaseKey = readEnvValue('VITE_SUPABASE_ANON_KEY') || readEnvValue('SUPABASE_ANON_KEY');

  if (!/^https:\/\/.+\.supabase\.co$/.test(supabaseUrl)) {
    throw new Error('Invalid Supabase URL. Expected https://<project>.supabase.co');
  }

  if (supabaseKey.length < 20) {
    throw new Error('Invalid Supabase anon key. Value is too short.');
  }

  console.log('Environment variables found.');
}

function main() {
  console.log('RunQuest PH pre-deploy checks');

  checkEnv();
  runChecked(npmCommand(), ['run', 'migration:check'], { stdio: 'inherit' });
  runChecked(npmCommand(), ['run', 'production:safety'], { stdio: 'inherit' });
  runChecked('npx', ['tsc', '-b'], { stdio: 'inherit' });
  runChecked(npmCommand(), ['run', 'build'], { stdio: 'inherit' });

  console.log('\nPre-deploy checks passed.');
}

try {
  main();
} catch (error) {
  console.error('\nPre-deploy checks failed.');
  console.error(error.message);
  process.exitCode = 1;
}
