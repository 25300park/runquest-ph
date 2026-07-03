import { spawnSync } from 'node:child_process';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const commitMessage = 'auto: safe push update';

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

function runRequired(command, args) {
  console.log(`\n$ ${command} ${args.join(' ')}`);
  const result = run(command, args, { stdio: 'inherit' });

  if (result.status !== 0) {
    throw new Error(`Command failed: ${command} ${args.join(' ')}`);
  }
}

function commandOutput(command, args) {
  const result = run(command, args);

  if (result.status !== 0) {
    const message = result.stderr || result.stdout || `Command failed: ${command} ${args.join(' ')}`;
    throw new Error(message.trim());
  }

  return result.stdout.trim();
}

async function askConfirmation() {
  const rl = readline.createInterface({ input, output });
  const answer = await rl.question('Changes detected. Do you want to commit and push? (y/n) ');
  rl.close();

  return answer.trim().toLowerCase() === 'y';
}

async function main() {
  console.log('RunQuest PH semi-automated safe push');

  console.log('\n$ git status --short');
  const status = commandOutput('git', ['status', '--short']);
  console.log(status || 'No changes detected.');

  console.log('\n$ git diff --stat');
  const diffSummary = commandOutput('git', ['diff', '--stat']);
  console.log(diffSummary || 'No unstaged diff summary.');

  if (!status) {
    console.log('\nNothing to commit or push.');
    return;
  }

  const confirmed = await askConfirmation();

  if (!confirmed) {
    console.log('Push cancelled by user');
    return;
  }

  runRequired('git', ['add', '.']);
  runRequired('git', ['commit', '-m', commitMessage]);
  runRequired('git', ['push', 'origin', 'main']);

  console.log('\nSafe push completed.');
}

main().catch((error) => {
  console.error('\nSafe push failed.');
  console.error(error.message);
  process.exitCode = 1;
});
