// src/server.ts
import 'dotenv/config';
import { createApp } from './app';
import { getDb } from './config/database';

const PORT = Number(process.env.PORT ?? 3000);

async function bootstrap(): Promise<void> {
  console.log('🗄️  Inicializando banco de dados...');
  await getDb();
  console.log('✅ Banco de dados pronto.\n');

  const app = createApp();

  app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
    console.log('\nEndpoints disponíveis:');
    console.log('  GET    /health');
    console.log('  POST   /auth/register');
    console.log('  POST   /auth/login');
    console.log('  GET    /auth/me                        [JWT]');
    console.log('  GET    /transactions                   [JWT]');
    console.log('  POST   /transactions                   [JWT]');
    console.log('  GET    /transactions/summary/by-category [JWT]');
    console.log('  GET    /transactions/:id               [JWT]');
    console.log('  PUT    /transactions/:id               [JWT]');
    console.log('  DELETE /transactions/:id               [JWT]');
  });
}

bootstrap().catch((err) => {
  console.error('Falha ao iniciar o servidor:', err);
  process.exit(1);
});
