import dotenv from 'dotenv';

dotenv.config({ quiet: true });

function readRequired(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Variável de ambiente obrigatória não definida: ${name}`);
  }

  return value;
}

export const environment = {
  port: Number(process.env.PORT ?? 3000),
  mongodbUri: readRequired('MONGODB_URI'),
  corsOrigin: readRequired('CORS_ORIGIN'),
};
