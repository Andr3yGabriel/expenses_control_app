"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.list = list;
exports.create = create;
exports.getOne = getOne;
exports.update = update;
exports.remove = remove;
exports.byCategory = byCategory;
const express_validator_1 = require("express-validator");
const database_1 = require("../config/database");
// ── GET /transactions ──────────────────────────────────────────────────────────
async function list(req, res) {
    try {
        const db = await (0, database_1.getDb)();
        const { type, category, from, to } = req.query;
        let sql = 'SELECT * FROM transactions WHERE user_id = ?';
        const params = [req.userId];
        if (type) {
            sql += ' AND type = ?';
            params.push(type);
        }
        if (category) {
            sql += ' AND category = ?';
            params.push(category);
        }
        if (from) {
            sql += ' AND date >= ?';
            params.push(from);
        }
        if (to) {
            sql += ' AND date <= ?';
            params.push(to);
        }
        sql += ' ORDER BY date DESC, created_at DESC';
        const transactions = (0, database_1.dbAll)(db, sql, params);
        const summary = transactions.reduce((acc, t) => {
            if (t.type === 'income')
                acc.totalIncome += t.amount;
            else
                acc.totalExpense += t.amount;
            acc.balance = acc.totalIncome - acc.totalExpense;
            return acc;
        }, { totalIncome: 0, totalExpense: 0, balance: 0 });
        const response = { transactions, summary };
        res.json(response);
    }
    catch (err) {
        console.error('[list]', err);
        res.status(500).json({ error: 'Erro ao buscar transações.' });
    }
}
// ── POST /transactions ─────────────────────────────────────────────────────────
async function create(req, res) {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }
    const { type, amount, category, description, date } = req.body;
    try {
        const db = await (0, database_1.getDb)();
        (0, database_1.dbRun)(db, `INSERT INTO transactions (user_id, type, amount, category, description, date)
       VALUES (?, ?, ?, ?, ?, ?)`, [req.userId, type, amount, category, description ?? null, date]);
        const created = (0, database_1.dbGet)(db, 'SELECT * FROM transactions WHERE user_id = ? ORDER BY id DESC LIMIT 1', [req.userId]);
        res.status(201).json({ transaction: created });
    }
    catch (err) {
        console.error('[create]', err);
        res.status(500).json({ error: 'Erro ao criar transação.' });
    }
}
// ── GET /transactions/:id ──────────────────────────────────────────────────────
async function getOne(req, res) {
    try {
        const db = await (0, database_1.getDb)();
        const id = Number(req.params.id);
        const transaction = (0, database_1.dbGet)(db, 'SELECT * FROM transactions WHERE id = ? AND user_id = ?', [id, req.userId]);
        if (!transaction) {
            res.status(404).json({ error: 'Transação não encontrada.' });
            return;
        }
        res.json({ transaction });
    }
    catch (err) {
        console.error('[getOne]', err);
        res.status(500).json({ error: 'Erro ao buscar transação.' });
    }
}
// ── PUT /transactions/:id ──────────────────────────────────────────────────────
async function update(req, res) {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }
    const id = Number(req.params.id);
    const { type, amount, category, description, date } = req.body;
    try {
        const db = await (0, database_1.getDb)();
        const existing = (0, database_1.dbGet)(db, 'SELECT id FROM transactions WHERE id = ? AND user_id = ?', [id, req.userId]);
        if (!existing) {
            res.status(404).json({ error: 'Transação não encontrada.' });
            return;
        }
        (0, database_1.dbRun)(db, `UPDATE transactions
       SET type = ?, amount = ?, category = ?, description = ?, date = ?
       WHERE id = ? AND user_id = ?`, [type, amount, category, description ?? null, date, id, req.userId]);
        const updated = (0, database_1.dbGet)(db, 'SELECT * FROM transactions WHERE id = ?', [id]);
        res.json({ transaction: updated });
    }
    catch (err) {
        console.error('[update]', err);
        res.status(500).json({ error: 'Erro ao atualizar transação.' });
    }
}
// ── DELETE /transactions/:id ───────────────────────────────────────────────────
async function remove(req, res) {
    const id = Number(req.params.id);
    try {
        const db = await (0, database_1.getDb)();
        const existing = (0, database_1.dbGet)(db, 'SELECT id FROM transactions WHERE id = ? AND user_id = ?', [id, req.userId]);
        if (!existing) {
            res.status(404).json({ error: 'Transação não encontrada.' });
            return;
        }
        (0, database_1.dbRun)(db, 'DELETE FROM transactions WHERE id = ? AND user_id = ?', [id, req.userId]);
        res.json({ message: 'Transação excluída com sucesso.' });
    }
    catch (err) {
        console.error('[remove]', err);
        res.status(500).json({ error: 'Erro ao excluir transação.' });
    }
}
// ── GET /transactions/summary/by-category ─────────────────────────────────────
async function byCategory(req, res) {
    const { from, to } = req.query;
    try {
        const db = await (0, database_1.getDb)();
        let sql = `
      SELECT category, type, SUM(amount) as total, COUNT(*) as count
      FROM transactions
      WHERE user_id = ?
    `;
        const params = [req.userId];
        if (from) {
            sql += ' AND date >= ?';
            params.push(from);
        }
        if (to) {
            sql += ' AND date <= ?';
            params.push(to);
        }
        sql += ' GROUP BY category, type ORDER BY total DESC';
        const data = (0, database_1.dbAll)(db, sql, params);
        res.json({ data });
    }
    catch (err) {
        console.error('[byCategory]', err);
        res.status(500).json({ error: 'Erro ao buscar resumo.' });
    }
}
//# sourceMappingURL=transactionController.js.map