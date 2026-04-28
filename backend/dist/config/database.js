"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDb = getDb;
exports.persist = persist;
exports.dbRun = dbRun;
exports.dbAll = dbAll;
exports.dbGet = dbGet;
// src/config/database.ts
const sql_js_1 = __importDefault(require("sql.js"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const DB_PATH = path_1.default.join(__dirname, '../../data/gastos.db');
let db = null;
let SQL = null;
async function getDb() {
    if (db)
        return db;
    SQL = await (0, sql_js_1.default)();
    if (fs_1.default.existsSync(DB_PATH)) {
        const fileBuffer = fs_1.default.readFileSync(DB_PATH);
        db = new SQL.Database(fileBuffer);
    }
    else {
        fs_1.default.mkdirSync(path_1.default.dirname(DB_PATH), { recursive: true });
        db = new SQL.Database();
    }
    runMigrations(db);
    return db;
}
// ── Migrations ─────────────────────────────────────────────────────────────────
function runMigrations(database) {
    // Tabela de controle de migrations
    database.run(`
    CREATE TABLE IF NOT EXISTS migrations (
      id   INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      run_at TEXT DEFAULT (datetime('now'))
    );
  `);
    const migrations = {
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
        const already = dbGet(database, 'SELECT id FROM migrations WHERE name = ?', [name]);
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
function persist(database) {
    const data = database.export();
    fs_1.default.writeFileSync(DB_PATH, Buffer.from(data));
}
/** Executa INSERT / UPDATE / DELETE e persiste */
function dbRun(database, sql, params = []) {
    database.run(sql, params);
    persist(database);
}
/** Retorna todos os resultados tipados */
function dbAll(database, sql, params = []) {
    const stmt = database.prepare(sql);
    stmt.bind(params);
    const rows = [];
    while (stmt.step()) {
        rows.push(stmt.getAsObject());
    }
    stmt.free();
    return rows;
}
/** Retorna o primeiro resultado ou null */
function dbGet(database, sql, params = []) {
    const rows = dbAll(database, sql, params);
    return rows[0] ?? null;
}
//# sourceMappingURL=database.js.map