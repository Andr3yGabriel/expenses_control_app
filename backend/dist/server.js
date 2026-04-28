"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/server.ts
require("dotenv/config");
const app_1 = require("./app");
const database_1 = require("./config/database");
const PORT = Number(process.env.PORT ?? 3000);
async function bootstrap() {
    console.log('🗄️  Inicializando banco de dados...');
    await (0, database_1.getDb)();
    console.log('✅ Banco de dados pronto.\n');
    const app = (0, app_1.createApp)();
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
//# sourceMappingURL=server.js.map