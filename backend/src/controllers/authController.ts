// src/controllers/authController.ts
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import { Database } from 'sql.js';
import { getDb, dbGet, dbRun } from '../config/database';
import {
  User,
  PublicUser,
  RegisterPayload,
  LoginPayload,
  AuthResponse,
  JwtPayload,
} from '../types';

// ── Helper ─────────────────────────────────────────────────────────────────────

function generateToken(userId: number): string {
  const payload: JwtPayload = { userId };
  return jwt.sign(payload, process.env.JWT_SECRET as string, {
    expiresIn: (process.env.JWT_EXPIRES_IN ?? '7d') as jwt.SignOptions['expiresIn'],
  });
}

// ── POST /auth/register ────────────────────────────────────────────────────────

export async function register(req: Request, res: Response): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const { name, email, password } = req.body as RegisterPayload;

  try {
    const db: Database = await getDb();

    const existing = dbGet<User>(db, 'SELECT id FROM users WHERE email = ?', [email]);
    if (existing) {
      res.status(409).json({ error: 'E-mail já cadastrado.' });
      return;
    }

    // custo 12: bom equilíbrio segurança/performance em ARM (M4)
    const password_hash = await bcrypt.hash(password, 12);

    dbRun(
      db,
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      [name, email, password_hash]
    );

    const user = dbGet<PublicUser>(
      db,
      'SELECT id, name, email, created_at FROM users WHERE email = ?',
      [email]
    );

    if (!user) {
      res.status(500).json({ error: 'Erro ao criar usuário.' });
      return;
    }

    const response: AuthResponse = { token: generateToken(user.id), user };
    res.status(201).json(response);
  } catch (err) {
    console.error('[register]', err);
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
}

// ── POST /auth/login ───────────────────────────────────────────────────────────

export async function login(req: Request, res: Response): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const { email, password } = req.body as LoginPayload;

  try {
    const db: Database = await getDb();

    const user = dbGet<User>(db, 'SELECT * FROM users WHERE email = ?', [email]);

    // Mensagem genérica: não revela se o e-mail existe
    if (!user) {
      res.status(401).json({ error: 'Credenciais inválidas.' });
      return;
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      res.status(401).json({ error: 'Credenciais inválidas.' });
      return;
    }

    const publicUser: PublicUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      created_at: user.created_at,
    };

    const response: AuthResponse = {
      token: generateToken(user.id),
      user: publicUser,
    };

    res.status(200).json(response);
  } catch (err) {
    console.error('[login]', err);
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
}

// ── GET /auth/me ───────────────────────────────────────────────────────────────

export async function me(req: Request, res: Response): Promise<void> {
  try {
    const db: Database = await getDb();

    const user = dbGet<PublicUser>(
      db,
      'SELECT id, name, email, created_at FROM users WHERE id = ?',
      [req.userId]
    );

    if (!user) {
      res.status(404).json({ error: 'Usuário não encontrado.' });
      return;
    }

    res.json({ user });
  } catch (err) {
    console.error('[me]', err);
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
}
