import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { getOutput, runChecked } from './pipeline-utils.js';

function getTags() {
  return getOutput('git', ['tag', '--list', 'v[0-9]*', '--sort=-v:refname'])
    .split(/\r?\n/)
    .filter(Boolean);
}

async function ask(question) {
  const rl = readline.createInterface({ input, output });
  const answer = await rl.question(question);
  rl.close();

  return answer.trim();
}

async function selectTag(tags) {
  console.log('Available release tags:');
  tags.forEach((tag, index) => {
    console.log(`${index + 1}. ${tag}`);
  });

  const answer = await ask('\nSelect rollback version by number or tag name: ');
  const index = Number(answer) - 1;
  const selectedTag = Number.isInteger(index) && tags[index] ? tags[index] : answer;

  if (!tags.includes(selectedTag)) {
    throw new Error(`Unknown rollback tag: ${selectedTag}`);
  }

  return selectedTag;
}

async function main() {
  console.log('RunQuest PH production rollback');

  const tags = getTags();
  if (tags.length === 0) {
    throw new Error('No release tags found. Rollback requires tags like v1.0.0.');
  }

  const selectedTag = await selectTag(tags);

  console.log(`
WARNING: This rollback is destructive.

It will execute:
  git reset --hard ${selectedTag}
  git push --force origin main

This rewrites the remote main branch and will trigger a Vercel deployment from the selected tag.
`);

  const confirmation = await ask(`Type ROLLBACK ${selectedTag} to continue: `);

  if (confirmation !== `ROLLBACK ${selectedTag}`) {
    console.log('Rollback cancelled. No Git state was changed.');
    return;
  }

  runChecked('git', ['reset', '--hard', selectedTag], { stdio: 'inherit' });
  runChecked('git', ['push', '--force', 'origin', 'main'], { stdio: 'inherit' });

  console.log(`Rollback completed to ${selectedTag}.`);
  console.log('Vercel deployment triggered via GitHub');
}

main().catch((error) => {
  console.error('\nRollback failed.');
  console.error(error.message);
  process.exitCode = 1;
});
