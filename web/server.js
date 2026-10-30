import express from 'express';
import dotenv from 'dotenv';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

dotenv.config({ quiet: true });

const require = createRequire(import.meta.url);
const publicDirectory = path.join(path.dirname(fileURLToPath(import.meta.url)), 'public');
const port = Number(process.env.WEB_PORT ?? 8080);
const apiUrl = process.env.API_URL;

if (!apiUrl) {
  console.error('Variável de ambiente API_URL não definida.');
  process.exit(1);
}

function directoryOfMain(packageName) {
  return path.dirname(require.resolve(packageName));
}

const jqueryDirectory = directoryOfMain('jquery');
const bootstrapScriptDirectory = directoryOfMain('bootstrap');
const momentDirectory = directoryOfMain('moment');

const vendorFiles = {
  '/vendor/jquery.min.js': path.join(jqueryDirectory, 'jquery.min.js'),
  '/vendor/bootstrap.bundle.min.js': path.join(bootstrapScriptDirectory, 'bootstrap.bundle.min.js'),
  '/vendor/bootstrap.min.css': path.join(bootstrapScriptDirectory, '../css/bootstrap.min.css'),
  '/vendor/moment.min.js': path.join(momentDirectory, 'min/moment.min.js'),
};

for (const [route, filePath] of Object.entries(vendorFiles)) {
  if (!existsSync(filePath)) {
    console.error(`Arquivo de vendor não encontrado para ${route}: ${filePath}`);
    process.exit(1);
  }
}

const app = express();

app.disable('x-powered-by');

app.get('/config.js', (_request, response) => {
  response.set('Cache-Control', 'no-store');
  response.type('application/javascript');
  response.send(`window.APP_CONFIG = ${JSON.stringify({ apiUrl })};`);
});

for (const [route, filePath] of Object.entries(vendorFiles)) {
  app.get(route, (_request, response) => {
    response.sendFile(filePath);
  });
}

app.use(express.static(publicDirectory));

const server = app.listen(port, () => {
  console.log(`Frontend ouvindo em http://localhost:${port}`);
});

server.on('error', (error) => {
  console.error('Falha ao iniciar o frontend.', error);
  process.exit(1);
});
