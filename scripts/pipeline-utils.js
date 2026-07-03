import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

export function run(command, args, options = {}) {
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

export function runChecked(command, args, options = {}) {
  console.log(`\n$ ${command} ${args.join(' ')}`);
  const result = run(command, args, options);

  if (result.status !== 0) {
    const message = result.stderr || result.stdout || `Command failed: ${command} ${args.join(' ')}`;
    throw new Error(message.trim());
  }

  const stdout = result.stdout?.trim() ?? '';

  if (options.stdio !== 'inherit' && stdout) {
    console.log(stdout);
  }

  return stdout;
}

export function getOutput(command, args) {
  const result = run(command, args);

  if (result.status !== 0) {
    return '';
  }

  return result.stdout.trim();
}

export function npmCommand() {
  return process.platform === 'win32' ? 'npm.cmd' : 'npm';
}

export function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

export function readEnvValue(key) {
  if (process.env[key]) {
    return process.env[key];
  }

  for (const filePath of ['.env.local', '.env.production', '.env']) {
    if (!existsSync(filePath)) {
      continue;
    }

    const lines = readFileSync(filePath, 'utf8').split(/\r?\n/);
    const match = lines.find((line) => {
      const trimmed = line.trim();
      return trimmed && !trimmed.startsWith('#') && trimmed.startsWith(`${key}=`);
    });

    if (match) {
      return match.slice(key.length + 1).trim().replace(/^["']|["']$/g, '');
    }
  }

  return '';
}

export async function confirm(question) {
  const rl = readline.createInterface({ input, output });
  const answer = await rl.question(question);
  rl.close();

  return answer.trim().toLowerCase() === 'y';
}

export function latestVersionTag() {
  const tag = getOutput('git', ['describe', '--tags', '--abbrev=0', '--match', 'v[0-9]*']);
  return tag || null;
}

export function parseVersion(version) {
  const match = version.match(/^v?(\d+)\.(\d+)\.(\d+)$/);

  if (!match) {
    throw new Error(`Invalid semantic version: ${version}`);
  }

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3])
  };
}

export function formatVersion(version) {
  return `${version.major}.${version.minor}.${version.patch}`;
}
