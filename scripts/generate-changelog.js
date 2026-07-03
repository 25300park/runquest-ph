import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { getOutput, latestVersionTag } from './pipeline-utils.js';

const changelogPath = 'CHANGELOG.md';
const now = new Date().toISOString();
const baseRef = latestVersionTag() ?? 'HEAD';

function getChangedFiles() {
  const committedRange = latestVersionTag() ? `${baseRef}..HEAD` : 'HEAD';
  const committed = getOutput('git', ['diff', '--name-status', committedRange])
    .split(/\r?\n/)
    .filter(Boolean);
  const workingDiff = getOutput('git', ['diff', '--name-status', 'HEAD'])
    .split(/\r?\n/)
    .filter(Boolean);
  const workingStatus = getOutput('git', ['status', '--short'])
    .split(/\r?\n/)
    .filter(Boolean);

  const filesByPath = new Map();

  for (const line of [...committed, ...workingDiff, ...workingStatus]) {
    filesByPath.set(getFilePath(line), line.trim());
  }

  return [...filesByPath.values()];
}

function getFilePath(line) {
  const parts = line.trim().split(/\s+/);
  return parts[parts.length - 1] ?? line;
}

function classifyChange(line) {
  const filePath = getFilePath(line);
  const lowerPath = filePath.toLowerCase();

  if (
    lowerPath.includes('supabase/') ||
    lowerPath.includes('schema.sql') ||
    lowerPath.includes('database.ts') ||
    lowerPath.includes('course_points')
  ) {
    return 'DB changes';
  }

  if (
    lowerPath.includes('service') ||
    lowerPath.includes('fix') ||
    lowerPath.includes('test') ||
    lowerPath.includes('lib/')
  ) {
    return 'Fixes';
  }

  return 'Features';
}

function formatLines(lines) {
  return lines.length ? lines.map((line) => `- ${line}`).join('\n') : '- None';
}

const changes = getChangedFiles();
const groups = {
  Features: [],
  Fixes: [],
  'DB changes': []
};

for (const change of changes) {
  groups[classifyChange(change)].push(change);
}

const stats = getOutput('git', ['diff', '--stat', 'HEAD']);
const statusSummary = getOutput('git', ['status', '--short']);
const heading = `## ${now}`;
const entry = `${heading}

Base reference: ${baseRef}

### Features
${formatLines(groups.Features)}

### Fixes
${formatLines(groups.Fixes)}

### DB changes
${formatLines(groups['DB changes'])}

### Diff summary
\`\`\`text
${[stats, statusSummary ? `\nWorking tree:\n${statusSummary}` : ''].filter(Boolean).join('\n') || 'No working tree diff detected.'}
\`\`\`
`;

const previous = existsSync(changelogPath) ? readFileSync(changelogPath, 'utf8') : '';
const nextContent = previous ? `${entry}\n${previous}\n` : `# Changelog\n\n${entry}\n`;

writeFileSync(changelogPath, nextContent, 'utf8');
console.log(`Generated ${changelogPath}`);
