"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
exports.me = me;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const express_validator_1 = require("express-validator");
const database_1 = require("../config/database");
// ── Helper ─────────────────────────────────────────────────────────────────────
function generateToken(userId) {
    const payload = { userId };
    return jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET, {
        expiresIn: (process.env.JWT_EXPIRES_IN ?? '7d'),
    });
}
// ── POST /auth/register ────────────────────────────────────────────────────────
async function register(req, res) {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }
    const { name, email, password } = req.body;
    try {
        const db = await (0, database_1.getDb)();
        const existing = (0, database_1.dbGet)(db, 'SELECT id FROM users WHERE email = ?', [email]);
        if (existing) {
            res.status(409).json({ error: 'E-mail já cadastrado.' });
            return;
        }
        // custo 12: bom equilíbrio segurança/performance em ARM (M4)
        const password_hash = await bcryptjs_1.default.hash(password, 12);
        (0, database_1.dbRun)(db, 'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)', [name, email, password_hash]);
        const user = (0, database_1.dbGet)(db, 'SELECT id, name, email, created_at FROM users WHERE email = ?', [email]);
        if (!user) {
            res.status(500).json({ error: 'Erro ao criar usuário.' });
            return;
        }
        const response = { token: generateToken(user.id), user };
        res.status(201).json(response);
    }
    catch (err) {
        console.error('[register]', err);
        res.status(500).json({ error: 'Erro interno no servidor.' });
    }
}
// ── POST /auth/login ───────────────────────────────────────────────────────────
async function login(req, res) {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }
    const { email, password } = req.body;
    try {
        const db = await (0, database_1.getDb)();
        const user = (0, database_1.dbGet)(db, 'SELECT * FROM users WHERE email = ?', [email]);
        // Mensagem genérica: não revela se o e-mail existe
        if (!user) {
            res.status(401).json({ error: 'Credenciais inválidas.' });
            return;
        }
        const passwordMatch = await bcryptjs_1.default.compare(password, user.password_hash);
        if (!passwordMatch) {
            res.status(401).json({ error: 'Credenciais inválidas.' });
            return;
        }
        const publicUser = {
            id: user.id,
            name: user.name,
            email: user.email,
            created_at: user.created_at,
        };
        const response = {
            token: generateToken(user.id),
            user: publicUser,
        };
        res.status(200).json(response);
    }
    catch (err) {
        console.error('[login]', err);
        res.status(500).json({ error: 'Erro interno no servidor.' });
    }
}
// ── GET /auth/me ───────────────────────────────────────────────────────────────
async function me(req, res) {
    try {
        const db = await (0, database_1.getDb)();
        const user = (0, database_1.dbGet)(db, 'SELECT id, name, email, created_at FROM users WHERE id = ?', [req.userId]);
        if (!user) {
            res.status(404).json({ error: 'Usuário não encontrado.' });
            return;
        }
        res.json({ user });
    }
    catch (err) {
        console.error('[me]', err);
        res.status(500).json({ error: 'Erro interno no servidor.' });
    }
}
//# sourceMappingURL=authController.js.map