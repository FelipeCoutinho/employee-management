import { createRequire } from 'node:module';

createRequire(import.meta.url)('../scripts/ensure-jest-vm.cjs');

export default {
  testEnvironment: 'node',
  transform: {},
  globalSetup: './tests/globalSetup.js',
  testTimeout: 20000,
};
