import { spawnSync } from 'node:child_process';

// This application is a client-only Vite SPA. It does not use React Router's
// RSC mode, server actions, or a React Router server runtime, so this advisory
// has no reachable execution path here. Keep the exception narrow: every
// other high or critical production advisory must still fail deployment.
const allowedAdvisories = new Set([
  'https://github.com/advisories/GHSA-qwww-vcr4-c8h2',
]);

const isWindows = process.platform === 'win32';
const npmCommand = isWindows ? process.env.ComSpec || 'cmd.exe' : 'npm';
const npmArgs = isWindows
  ? ['/d', '/s', '/c', 'npm audit --omit=dev --json']
  : ['audit', '--omit=dev', '--json'];
const audit = spawnSync(npmCommand, npmArgs, {
  encoding: 'utf8',
});

if (!audit.stdout) {
  console.error(audit.stderr || 'npm audit returned no report.');
  process.exit(1);
}

let report;
try {
  report = JSON.parse(audit.stdout);
} catch {
  console.error('npm audit returned an unreadable report.');
  console.error(audit.stdout.slice(0, 1000));
  process.exit(1);
}

const actionable = [];
const acknowledged = [];
for (const vulnerability of Object.values(report.vulnerabilities || {})) {
  for (const advisory of vulnerability.via || []) {
    if (typeof advisory === 'string') continue;
    if (!['high', 'critical'].includes(advisory.severity)) continue;
    const item = `${advisory.name}: ${advisory.title} (${advisory.url})`;
    if (allowedAdvisories.has(advisory.url)) acknowledged.push(item);
    else actionable.push(item);
  }
}

if (actionable.length > 0) {
  console.error('Unapproved high or critical production vulnerabilities:');
  actionable.forEach(item => console.error(`- ${item}`));
  process.exit(1);
}

if (acknowledged.length > 0) {
  console.warn('Acknowledged non-applicable server-mode advisory:');
  [...new Set(acknowledged)].forEach(item => console.warn(`- ${item}`));
}
console.log('No actionable high or critical production vulnerabilities.');
