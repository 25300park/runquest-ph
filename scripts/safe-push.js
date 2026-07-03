import { confirm, npmCommand, runChecked } from './pipeline-utils.js';

const commitMessage = 'auto update: RunQuest PH course system improvements';

async function main() {
  console.log('RunQuest PH safe production push');

  runChecked('node', ['scripts/pre-deploy-check.js'], { stdio: 'inherit' });
  runChecked('node', ['scripts/supabase-migration-check.js'], { stdio: 'inherit' });
  runChecked('node', ['scripts/generate-changelog.js'], { stdio: 'inherit' });

  runChecked('git', ['status', '--short'], { stdio: 'inherit' });
  runChecked('git', ['diff', '--stat'], { stdio: 'inherit' });

  const proceed = await confirm('\nProceed with deployment? (y/n) ');

  if (!proceed) {
    console.log('Deployment aborted safely. Nothing was staged, committed, pushed, or tagged.');
    return;
  }

  runChecked('node', ['scripts/release-version.js', '--prepare-only'], { stdio: 'inherit' });
  runChecked(npmCommand(), ['run', 'build'], { stdio: 'inherit' });
  runChecked('git', ['add', '.'], { stdio: 'inherit' });
  runChecked('git', ['commit', '-m', commitMessage], { stdio: 'inherit' });
  runChecked('git', ['push', 'origin', 'main'], { stdio: 'inherit' });
  runChecked('node', ['scripts/release-version.js', '--tag-current', '--push'], { stdio: 'inherit' });

  console.log('\nSafe production push completed.');
}

main().catch((error) => {
  console.error('\nSafe production push failed.');
  console.error(error.message);
  process.exitCode = 1;
});
