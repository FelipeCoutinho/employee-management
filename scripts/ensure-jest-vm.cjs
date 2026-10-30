const { spawnSync } = require('node:child_process');

const flag = '--experimental-vm-modules';
const nodeOptions = process.env.NODE_OPTIONS || '';
const enabled = process.execArgv.includes(flag) || nodeOptions.includes(flag);

if (!enabled && process.env.JEST_VM_MODULES_REEXEC !== '1') {
  const result = spawnSync(
    process.execPath,
    [flag, ...process.execArgv, ...process.argv.slice(1)],
    {
      stdio: 'inherit',
      env: {
        ...process.env,
        JEST_VM_MODULES_REEXEC: '1',
        TZ: process.env.TZ || 'America/Sao_Paulo',
      },
    },
  );

  process.exit(result.status === null ? 1 : result.status);
}
