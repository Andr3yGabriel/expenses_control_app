import { Database } from 'sql.js';
export declare function getDb(): Promise<Database>;
/** Persiste o banco em disco (SQLite em arquivo) */
export declare function persist(database: Database): void;
/** Executa INSERT / UPDATE / DELETE e persiste */
export declare function dbRun(database: Database, sql: string, params?: (string | number | null)[]): void;
/** Retorna todos os resultados tipados */
export declare function dbAll<T>(database: Database, sql: string, params?: (string | number | null)[]): T[];
/** Retorna o primeiro resultado ou null */
export declare function dbGet<T>(database: Database, sql: string, params?: (string | number | null)[]): T | null;
//# sourceMappingURL=database.d.ts.map