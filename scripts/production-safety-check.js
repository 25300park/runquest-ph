import { readFileSync } from 'node:fs';
import { getOutput } from './pipeline-utils.js';

const criticalRoots = ['src/admin', 'src/services', 'src/features'];
const forbiddenPatterns = [
  {
    name: 'mock import in production critical modules',
    pattern: /from\s+['"].*mock|import\s+.*mock/i
  },
  {
    name: 'console.error in production critical modules',
    pattern: /\bconsole\.error\b/
  }
];

function listCriticalFiles() {
  return getOutput('git', ['ls-files', ...criticalRoots])
    .split(/\r?\n/)
    .filter((file) => /\.(ts|tsx|js|jsx)$/.test(file));
}

function main() {
  console.log('RunQuest PH production safety check');

  const violations = [];
  for (const filePath of listCriticalFiles()) {
    const content = readFileSync(filePath, 'utf8');
    for (const rule of forbiddenPatterns) {
      if (rule.pattern.test(content)) {
        violations.push(`${filePath}: ${rule.name}`);
      }
    }
  }

  if (violations.length > 0) {
    throw new Error(`Production safety violations:\n${violations.join('\n')}`);
  }

  console.log('Production safety check passed.');
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
