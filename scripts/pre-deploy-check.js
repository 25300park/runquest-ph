import { readEnvValue, npmCommand, runChecked } from './pipeline-utils.js';

const requiredEnvVars = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];

function checkEnv() {
  console.log('\nChecking required environment variables...');
  const missing = requiredEnvVars.filter((key) => !readEnvValue(key));

  if (missing.length > 0) {
    throw new Error(`Missing required env variables: ${missing.join(', ')}`);
  }

  console.log('Environment variables found.');
}

function main() {
  console.log('RunQuest PH pre-deploy checks');

  checkEnv();
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
