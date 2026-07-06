import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { formatVersion, getOutput, parseVersion, runChecked } from './pipeline-utils.js';

function parseChangedFiles(status) {
  return status
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(/\s+/);
      return {
        status: parts[0],
        path: parts[parts.length - 1]
      };
    });
}

function describeFile(filePath) {
  const lowerPath = filePath.toLowerCase();

  if (lowerPath.includes('explorationmap') || lowerPath.includes('activitytracking')) {
    return 'route flow update';
  }

  if (lowerPath.includes('courseservice') || lowerPath.includes('supabase')) {
    return 'Supabase integration update';
  }

  if (lowerPath.includes('scripts/') || lowerPath.includes('package.json')) {
    return 'DevOps automation update';
  }

  if (lowerPath.includes('routes')) {
    return 'routing update';
  }

  if (lowerPath.includes('docs/') || lowerPath.includes('changelog')) {
    return 'release documentation update';
  }

  return 'project update';
}

function printDiffAnalysis(changedFiles) {
  console.log('\nChanged files summary:');

  if (changedFiles.length === 0) {
    console.log('- No changed files detected.');
    return;
  }

  for (const file of changedFiles) {
    console.log(`- ${file.path} (${describeFile(file.path)})`);
  }
}

export function generateCommitMessage(changedFiles) {
  const paths = changedFiles.map((file) => file.path.toLowerCase());
  const hasDevOps = paths.some(
    (path) => path.includes('scripts/') || path.includes('package.json') || path.includes('vercel')
  );
  const hasFix = paths.some(
    (path) =>
      path.includes('supabase') ||
      path.includes('courseservice') ||
      path.includes('activitytracking') ||
      path.includes('coursedetail') ||
      path.includes('routes')
  );
  const hasRefactor = paths.some((path) => path.includes('utils/') || path.includes('types/'));

  if (hasDevOps) {
    return 'deploy: add unified DevOps automation workflow';
  }

  if (hasFix) {
    return 'fix: update route and Supabase integration flow';
  }

  if (hasRefactor) {
    return 'refactor: improve project structure';
  }

  return 'feat: update RunQuest PH experience';
}

function nextPatchTag() {
  const tags = getOutput('git', ['tag', '--list', 'v[0-9]*', '--sort=-v:refname'])
    .split(/\r?\n/)
    .filter(Boolean);

  if (tags.length === 0) {
    return 'v1.0.0';
  }

  const latest = parseVersion(tags[0]);
  return `v${formatVersion({
    major: latest.major,
    minor: latest.minor,
    patch: latest.patch + 1
  })}`;
}

async function confirm(question) {
  const rl = readline.createInterface({ input, output });
  const answer = await rl.question(question);
  rl.close();

  return answer.trim().toLowerCase() === 'y';
}

async function main() {
  console.log('RunQuest PH unified DevOps CLI');

  console.log('\n$ git status --short');
  const status = getOutput('git', ['status', '--short']);
  console.log(status || 'No changes detected.');

  console.log('\n$ git diff --stat');
  const diffStat = getOutput('git', ['diff', '--stat']);
  console.log(diffStat || 'No tracked-file diff summary. Check status for untracked files.');

  const changedFiles = parseChangedFiles(status);
  printDiffAnalysis(changedFiles);

  if (changedFiles.length === 0) {
    console.log('\nNothing to commit or push.');
    return;
  }

  const commitMessage = generateCommitMessage(changedFiles);
  console.log(`\nGenerated commit message: ${commitMessage}`);

  const shouldPush = await confirm('\nProceed with commit & push? (y/n) ');

  if (!shouldPush) {
    console.log('DevOps push aborted safely.');
    return;
  }

  runChecked('git', ['add', '.'], { stdio: 'inherit' });
  runChecked('git', ['commit', '-m', commitMessage], { stdio: 'inherit' });
  runChecked('git', ['push', 'origin', 'main'], { stdio: 'inherit' });
  console.log('Vercel deployment triggered via GitHub');

  const tagName = nextPatchTag();
  runChecked('git', ['tag', '-a', tagName, '-m', 'release version'], { stdio: 'inherit' });
  runChecked('git', ['push', 'origin', '--tags'], { stdio: 'inherit' });
  console.log(`Release tag pushed: ${tagName}`);
}

main().catch((error) => {
  console.error('\nDevOps CLI failed.');
  console.error(error.message);
  process.exitCode = 1;
});
