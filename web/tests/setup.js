import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const moment = require('moment');

globalThis.moment = moment;
