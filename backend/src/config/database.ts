// src/config/database.ts
import initSqlJs, { Database, SqlJsStatic } from 'sql.js';
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(__dirname, '../../data/gastos.db');

let db: Database | null = null;
let SQL: SqlJsStatic | null = null;

export async function getDb(): Promise<Database> {
  if (db) return db;

  SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    db = new SQL.Database();
  }

  runMigrations(db);
  return db;
}

// ── Migrations ─────────────────────────────────────────────────────────────────

function runMigrations(database: Database): void {
  // Tabela de controle de migrations
  database.run(`
    CREATE TABLE IF NOT EXISTS migrations (
      id   INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      run_at TEXT DEFAULT (datetime('now'))
    );
  `);

  const migrations: Record<string, string> = {
    '001_create_users': `
      CREATE TABLE IF NOT EXISTS users (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        name          TEXT    NOT NULL,
        email         TEXT    NOT NULL UNIQUE,
        password_hash TEXT    NOT NULL,
        created_at    TEXT    DEFAULT (datetime('now'))
      );
    `,
    '002_create_transactions': `
      CREATE TABLE IF NOT EXISTS transactions (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id     INTEGER NOT NULL,
        type        TEXT    NOT NULL CHECK(type IN ('income', 'expense')),
        amount      REAL    NOT NULL CHECK(amount > 0),
        category    TEXT    NOT NULL,
        description TEXT,
        date        TEXT    NOT NULL,
        created_at  TEXT    DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `,
    '003_create_indexes': `
      CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_date    ON transactions(date);
      CREATE INDEX IF NOT EXISTS idx_transactions_type    ON transactions(type);
    `,
  };

  for (const [name, sql] of Object.entries(migrations)) {
    const already = dbGet<{ id: number }>(
      database,
      'SELECT id FROM migrations WHERE name = ?',
      [name]
    );
    if (!already) {
      database.run(sql);
      database.run('INSERT INTO migrations (name) VALUES (?)', [name]);
      console.log(`  ✓ migration: ${name}`);
    }
  }

  persist(database);
}

// ── Helpers com tipos genéricos ────────────────────────────────────────────────

/** Persiste o banco em disco (SQLite em arquivo) */
export function persist(database: Database): void {
  const data = database.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

/** Executa INSERT / UPDATE / DELETE e persiste */
export function dbRun(
  database: Database,
  sql: string,
  params: (string | number | null)[] = []
): void {
  database.run(sql, params);
  persist(database);
}

/** Retorna todos os resultados tipados */
export function dbAll<T>(
  database: Database,
  sql: string,
  params: (string | number | null)[] = []
): T[] {
  const stmt = database.prepare(sql);
  stmt.bind(params);
  const rows: T[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject() as T);
  }
  stmt.free();
  return rows;
}

/** Retorna o primeiro resultado ou null */
export function dbGet<T>(
  database: Database,
  sql: string,
  params: (string | number | null)[] = []
): T | null {
  const rows = dbAll<T>(database, sql, params);
  return rows[0] ?? null;
}
