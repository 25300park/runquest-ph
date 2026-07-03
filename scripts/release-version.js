import { existsSync, writeFileSync } from 'node:fs';
import {
  confirm,
  formatVersion,
  getOutput,
  parseVersion,
  readJson,
  runChecked
} from './pipeline-utils.js';

const args = process.argv.slice(2);
const packagePath = 'package.json';
const packageLockPath = 'package-lock.json';

function getBumpType() {
  if (args.includes('--major')) return 'major';
  if (args.includes('--minor')) return 'minor';
  return 'patch';
}

function nextVersion(currentVersion, bumpType) {
  const version = parseVersion(currentVersion);

  if (bumpType === 'major') {
    return { major: version.major + 1, minor: 0, patch: 0 };
  }

  if (bumpType === 'minor') {
    return { major: version.major, minor: version.minor + 1, patch: 0 };
  }

  return { major: version.major, minor: version.minor, patch: version.patch + 1 };
}

function writePackageVersion(version) {
  const pkg = readJson(packagePath);
  pkg.version = version;
  writeFileSync(packagePath, `${JSON.stringify(pkg, null, 2)}\n`, 'utf8');

  if (existsSync(packageLockPath)) {
    const lock = readJson(packageLockPath);
    lock.version = version;

    if (lock.packages?.['']) {
      lock.packages[''].version = version;
    }

    writeFileSync(packageLockPath, `${JSON.stringify(lock, null, 2)}\n`, 'utf8');
  }
}

function assertTagDoesNotExist(tagName) {
  const existingTag = getOutput('git', ['tag', '--list', tagName]);

  if (existingTag) {
    throw new Error(`Git tag already exists: ${tagName}`);
  }
}

function createTag(version, shouldPush) {
  const tagName = `v${version}`;
  assertTagDoesNotExist(tagName);
  runChecked('git', ['tag', tagName], { stdio: 'inherit' });

  if (shouldPush) {
    runChecked('git', ['push', 'origin', tagName], { stdio: 'inherit' });
  }

  console.log(`Release tag ready: ${tagName}`);
}

async function main() {
  const pkg = readJson(packagePath);

  if (args.includes('--tag-current')) {
    createTag(pkg.version, args.includes('--push'));
    return;
  }

  const bumpType = getBumpType();
  const next = formatVersion(nextVersion(pkg.version, bumpType));
  writePackageVersion(next);
  console.log(`Prepared release version: v${next}`);

  if (args.includes('--prepare-only')) {
    return;
  }

  const shouldRelease = args.includes('--yes')
    ? true
    : await confirm('Commit release version, create tag, and push to GitHub? (y/n) ');

  if (!shouldRelease) {
    console.log('Release aborted. Version files were updated locally only.');
    return;
  }

  runChecked('git', ['add', packagePath, packageLockPath], { stdio: 'inherit' });
  runChecked('git', ['commit', '-m', `release: v${next}`], { stdio: 'inherit' });
  runChecked('git', ['push', 'origin', 'main'], { stdio: 'inherit' });
  createTag(next, true);
}

main().catch((error) => {
  console.error('\nRelease version failed.');
  console.error(error.message);
  process.exitCode = 1;
});
