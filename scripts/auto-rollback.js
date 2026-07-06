import { getOutput, runChecked, readEnvValue } from './pipeline-utils.js';

function getRecentTags() {
  return getOutput('git', ['tag', '--list', 'v[0-9]*', '--sort=-v:refname'])
    .split(/\r?\n/)
    .filter(Boolean)
    .slice(0, 3);
}

function main() {
  console.log('RunQuest PH automated rollback');

  if (readEnvValue('AUTO_ROLLBACK') !== 'true') {
    console.log('AUTO_ROLLBACK is not true. Skipping rollback.');
    return;
  }

  const tags = getRecentTags();
  const rollbackTarget = tags[1] ?? tags[0];

  if (!rollbackTarget) {
    throw new Error('No previous deployment tag found for rollback.');
  }

  console.log(`Rolling back production to ${rollbackTarget}`);
  runChecked('git', ['reset', '--hard', rollbackTarget], { stdio: 'inherit' });
  runChecked('git', ['push', '--force', 'origin', 'main'], { stdio: 'inherit' });
  console.log('Rollback push completed. Vercel deployment triggered via GitHub.');
}

try {
  main();
} catch (error) {
  console.error('Automated rollback failed.');
  console.error(error.message);
  process.exitCode = 1;
}
