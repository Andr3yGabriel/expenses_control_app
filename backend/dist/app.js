"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
// src/app.ts
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const auth_1 = __importDefault(require("./routes/auth"));
const transactions_1 = __importDefault(require("./routes/transactions"));
function createApp() {
    const app = (0, express_1.default)();
    // ── Middlewares globais ──────────────────────────────────────────────────────
    app.use((0, cors_1.default)({
        origin: '*', // em produção: substitua pelo IP do servidor onde o app conecta
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    }));
    app.use(express_1.default.json());
    // ── Rotas ────────────────────────────────────────────────────────────────────
    app.use('/auth', auth_1.default);
    app.use('/transactions', transactions_1.default);
    app.get('/health', (_req, res) => {
        res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });
    // 404
    app.use((req, res) => {
        res.status(404).json({ error: `Rota ${req.method} ${req.path} não encontrada.` });
    });
    // Handler de erros global
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    app.use((err, _req, res, _next) => {
        console.error(err.stack);
        res.status(500).json({ error: 'Erro interno no servidor.' });
    });
    return app;
}
//# sourceMappingURL=app.js.map