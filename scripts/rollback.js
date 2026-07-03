import { confirm, getOutput, runChecked } from './pipeline-utils.js';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

function getTags() {
  return getOutput('git', ['tag', '--sort=-creatordate'])
    .split(/\r?\n/)
    .filter((tag) => /^v\d+\.\d+\.\d+$/.test(tag));
}

async function askForTag(tags) {
  console.log('Available release tags:');
  tags.slice(0, 20).forEach((tag, index) => {
    console.log(`${index + 1}. ${tag}`);
  });

  const rl = readline.createInterface({ input, output });
  const answer = await rl.question('\nRollback to which tag? Enter number or tag name: ');
  rl.close();

  const index = Number(answer.trim()) - 1;
  const selected = Number.isInteger(index) && tags[index] ? tags[index] : answer.trim();

  if (!tags.includes(selected)) {
    throw new Error(`Unknown release tag: ${selected}`);
  }

  return selected;
}

async function main() {
  console.log('RunQuest PH rollback assistant');

  const tags = getTags();
  if (tags.length === 0) {
    throw new Error('No semantic release tags found.');
  }

  const selectedTag = await askForTag(tags);
  const branchName = `rollback-${selectedTag.replace(/^v/, 'v').replace(/\./g, '-')}`;
  const shouldCreateBranch = await confirm(
    `Create local rollback branch "${branchName}" from ${selectedTag}? (y/n) `
  );

  if (!shouldCreateBranch) {
    console.log('Rollback aborted safely. No Git state was changed.');
    return;
  }

  runChecked('git', ['switch', '-c', branchName, selectedTag], { stdio: 'inherit' });

  console.log(`
Rollback branch created: ${branchName}

Next production rollback steps:
1. Review the app locally:
   npm.cmd run build

2. Push the rollback branch if it is the correct target:
   git push origin ${branchName}

3. In Vercel, redeploy the deployment associated with ${selectedTag}, or promote this rollback branch.

4. Supabase rollback is manual by design:
   - Review supabase/schema.sql at ${selectedTag}
   - Apply only the required reverse migration in the Supabase SQL editor
   - Never run destructive DB rollback SQL without a backup
`);
}

main().catch((error) => {
  console.error('\nRollback failed.');
  console.error(error.message);
  process.exitCode = 1;
});
