import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

dotenv.config({
  path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../../.env'),
  override: true,
  quiet: true,
});

function readRequired(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Variável de ambiente obrigatória não definida: ${name}`);
  }

  return value;
}

export const environment = {
  get port() {
    return Number(process.env.PORT ?? 3000);
  },
  get mongodbUri() {
    return readRequired('MONGODB_URI');
  },
  get corsOrigin() {
    return readRequired('CORS_ORIGIN');
  },
};
