import { spawnSync } from 'node:child_process';
const checks = [
  ['Node 22', process.versions.node.startsWith('22.')],
  ...(['java', 'gradle', 'sdkmanager', 'adb', 'docker'] as const).map(command => {
    const result = spawnSync(command, [command === 'java' ? '-version' : '--version'], {stdio: 'ignore', timeout: 10000});
    return [command, !result.error && result.status === 0] as const;
  }),
  ['ANDROID_HOME or ANDROID_SDK_ROOT', Boolean(process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT)],
] as const;
for (const [name, ok] of checks) console.log(`${ok ? 'PASS' : 'MISSING'} ${name}`);
console.log('Presence checks only; this does not prove SDK compatibility, container isolation, or APK build success.');
if (checks.some(([, ok]) => !ok)) process.exitCode = 1;
