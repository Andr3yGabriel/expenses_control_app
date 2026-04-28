// src/controllers/transactionController.ts
import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { Database } from 'sql.js';
import { getDb, dbGet, dbAll, dbRun } from '../config/database';
import {
  Transaction,
  CategorySummary,
  CreateTransactionPayload,
  TransactionListResponse,
  TransactionSummary,
} from '../types';

// ── GET /transactions ──────────────────────────────────────────────────────────

export async function list(req: Request, res: Response): Promise<void> {
  try {
    const db: Database = await getDb();
    const { type, category, from, to } = req.query as Record<string, string | undefined>;

    let sql = 'SELECT * FROM transactions WHERE user_id = ?';
    const params: (string | number)[] = [req.userId];

    if (type)     { sql += ' AND type = ?';     params.push(type); }
    if (category) { sql += ' AND category = ?'; params.push(category); }
    if (from)     { sql += ' AND date >= ?';    params.push(from); }
    if (to)       { sql += ' AND date <= ?';    params.push(to); }

    sql += ' ORDER BY date DESC, created_at DESC';

    const transactions = dbAll<Transaction>(db, sql, params);

    const summary = transactions.reduce<TransactionSummary>(
      (acc, t) => {
        if (t.type === 'income') acc.totalIncome += t.amount;
        else acc.totalExpense += t.amount;
        acc.balance = acc.totalIncome - acc.totalExpense;
        return acc;
      },
      { totalIncome: 0, totalExpense: 0, balance: 0 }
    );

    const response: TransactionListResponse = { transactions, summary };
    res.json(response);
  } catch (err) {
    console.error('[list]', err);
    res.status(500).json({ error: 'Erro ao buscar transações.' });
  }
}

// ── POST /transactions ─────────────────────────────────────────────────────────

export async function create(req: Request, res: Response): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const { type, amount, category, description, date } =
    req.body as CreateTransactionPayload;

  try {
    const db: Database = await getDb();

    dbRun(
      db,
      `INSERT INTO transactions (user_id, type, amount, category, description, date)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.userId, type, amount, category, description ?? null, date]
    );

    const created = dbGet<Transaction>(
      db,
      'SELECT * FROM transactions WHERE user_id = ? ORDER BY id DESC LIMIT 1',
      [req.userId]
    );

    res.status(201).json({ transaction: created });
  } catch (err) {
    console.error('[create]', err);
    res.status(500).json({ error: 'Erro ao criar transação.' });
  }
}

// ── GET /transactions/:id ──────────────────────────────────────────────────────

export async function getOne(req: Request, res: Response): Promise<void> {
  try {
    const db: Database = await getDb();
    const id = Number(req.params.id);

    const transaction = dbGet<Transaction>(
      db,
      'SELECT * FROM transactions WHERE id = ? AND user_id = ?',
      [id, req.userId]
    );

    if (!transaction) {
      res.status(404).json({ error: 'Transação não encontrada.' });
      return;
    }

    res.json({ transaction });
  } catch (err) {
    console.error('[getOne]', err);
    res.status(500).json({ error: 'Erro ao buscar transação.' });
  }
}

// ── PUT /transactions/:id ──────────────────────────────────────────────────────

export async function update(req: Request, res: Response): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const id = Number(req.params.id);
  const { type, amount, category, description, date } =
    req.body as CreateTransactionPayload;

  try {
    const db: Database = await getDb();

    const existing = dbGet<Pick<Transaction, 'id'>>(
      db,
      'SELECT id FROM transactions WHERE id = ? AND user_id = ?',
      [id, req.userId]
    );

    if (!existing) {
      res.status(404).json({ error: 'Transação não encontrada.' });
      return;
    }

    dbRun(
      db,
      `UPDATE transactions
       SET type = ?, amount = ?, category = ?, description = ?, date = ?
       WHERE id = ? AND user_id = ?`,
      [type, amount, category, description ?? null, date, id, req.userId]
    );

    const updated = dbGet<Transaction>(
      db,
      'SELECT * FROM transactions WHERE id = ?',
      [id]
    );

    res.json({ transaction: updated });
  } catch (err) {
    console.error('[update]', err);
    res.status(500).json({ error: 'Erro ao atualizar transação.' });
  }
}

// ── DELETE /transactions/:id ───────────────────────────────────────────────────

export async function remove(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);

  try {
    const db: Database = await getDb();

    const existing = dbGet<Pick<Transaction, 'id'>>(
      db,
      'SELECT id FROM transactions WHERE id = ? AND user_id = ?',
      [id, req.userId]
    );

    if (!existing) {
      res.status(404).json({ error: 'Transação não encontrada.' });
      return;
    }

    dbRun(
      db,
      'DELETE FROM transactions WHERE id = ? AND user_id = ?',
      [id, req.userId]
    );

    res.json({ message: 'Transação excluída com sucesso.' });
  } catch (err) {
    console.error('[remove]', err);
    res.status(500).json({ error: 'Erro ao excluir transação.' });
  }
}

// ── GET /transactions/summary/by-category ─────────────────────────────────────

export async function byCategory(req: Request, res: Response): Promise<void> {
  const { from, to } = req.query as Record<string, string | undefined>;

  try {
    const db: Database = await getDb();

    let sql = `
      SELECT category, type, SUM(amount) as total, COUNT(*) as count
      FROM transactions
      WHERE user_id = ?
    `;
    const params: (string | number)[] = [req.userId];

    if (from) { sql += ' AND date >= ?'; params.push(from); }
    if (to)   { sql += ' AND date <= ?'; params.push(to); }

    sql += ' GROUP BY category, type ORDER BY total DESC';

    const data = dbAll<CategorySummary>(db, sql, params);
    res.json({ data });
  } catch (err) {
    console.error('[byCategory]', err);
    res.status(500).json({ error: 'Erro ao buscar resumo.' });
  }
}
