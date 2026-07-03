import { spawnSync } from 'node:child_process';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const commitMessage = 'auto update: RunQuest PH course system improvements';

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    shell: process.platform === 'win32',
    stdio: options.stdio ?? 'pipe'
  });

  if (result.error) {
    throw result.error;
  }

  return result;
}

function printCommand(command, args) {
  console.log(`\n$ ${command} ${args.join(' ')}`);
}

function runVisible(command, args) {
  printCommand(command, args);
  const result = run(command, args, { stdio: 'inherit' });

  if (result.status !== 0) {
    throw new Error(`Command failed: ${command} ${args.join(' ')}`);
  }
}

function getOutput(command, args) {
  const result = run(command, args);

  if (result.status !== 0) {
    const message = result.stderr || result.stdout || `Command failed: ${command} ${args.join(' ')}`;
    throw new Error(message.trim());
  }

  return result.stdout.trim();
}

async function main() {
  console.log('RunQuest PH Git Push Confirmation');

  printCommand('git', ['status', '--short']);
  const status = getOutput('git', ['status', '--short']);
  console.log(status || 'No changes detected.');

  printCommand('git', ['diff', '--stat']);
  const diffSummary = getOutput('git', ['diff', '--stat']);
  console.log(diffSummary || 'No unstaged diff summary.');

  if (!status) {
    console.log('\nNothing to commit or push.');
    return;
  }

  const rl = readline.createInterface({ input, output });
  const answer = await rl.question('\nChanges detected. Do you want to push to GitHub? (y/n) ');
  rl.close();

  if (answer.trim().toLowerCase() !== 'y') {
    console.log('Push aborted safely. No Git changes were staged, committed, or pushed.');
    return;
  }

  runVisible('git', ['add', '.']);
  runVisible('git', ['commit', '-m', commitMessage]);
  runVisible('git', ['push', 'origin', 'main']);

  console.log('\nPush completed.');
}

main().catch((error) => {
  console.error('\nGit push confirmation failed.');
  console.error(error.message);
  process.exitCode = 1;
});
