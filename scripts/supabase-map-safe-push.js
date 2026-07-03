import { confirm, runChecked } from './pipeline-utils.js';

const commitMessage = 'fix: Supabase Exploration Map connection and debug logging';

async function main() {
  console.log('RunQuest PH Supabase Exploration Map safe push');

  runChecked('git', ['status', '--short'], { stdio: 'inherit' });
  runChecked('git', ['diff', '--stat'], { stdio: 'inherit' });

  const shouldPush = await confirm('Changes applied. Do you want to commit and push to GitHub? (y/n) ');

  if (!shouldPush) {
    console.log('Push aborted safely. No Git changes were staged, committed, or pushed.');
    return;
  }

  runChecked('git', ['add', '.'], { stdio: 'inherit' });
  runChecked('git', ['commit', '-m', commitMessage], { stdio: 'inherit' });
  runChecked('git', ['push', 'origin', 'main'], { stdio: 'inherit' });

  console.log('Commit and push completed.');
}

main().catch((error) => {
  console.error('\nSupabase Exploration Map safe push failed.');
  console.error(error.message);
  process.exitCode = 1;
});
