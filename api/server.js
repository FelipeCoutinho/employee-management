import { app } from './src/app.js';
import { connectDatabase } from './src/config/database.js';
import { environment } from './src/config/environment.js';

try {
  await connectDatabase();
} catch (error) {
  console.error('Falha ao conectar no MongoDB.', error);
  process.exit(1);
}

const server = app.listen(environment.port, () => {
  console.log(`API ouvindo em http://localhost:${environment.port}`);
});

server.on('error', (error) => {
  console.error('Falha ao iniciar a API.', error);
  process.exit(1);
});
