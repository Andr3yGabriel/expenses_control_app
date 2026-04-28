export interface User {
    id: number;
    name: string;
    email: string;
    password_hash: string;
    created_at: string;
}
export type PublicUser = Omit<User, 'password_hash'>;
export type TransactionType = 'income' | 'expense';
export interface Transaction {
    id: number;
    user_id: number;
    type: TransactionType;
    amount: number;
    category: string;
    description: string | null;
    date: string;
    created_at: string;
}
export interface CategorySummary {
    category: string;
    type: TransactionType;
    total: number;
    count: number;
}
export interface RegisterPayload {
    name: string;
    email: string;
    password: string;
}
export interface LoginPayload {
    email: string;
    password: string;
}
export interface CreateTransactionPayload {
    type: TransactionType;
    amount: number;
    category: string;
    description?: string;
    date: string;
}
export interface AuthResponse {
    token: string;
    user: PublicUser;
}
export interface TransactionSummary {
    totalIncome: number;
    totalExpense: number;
    balance: number;
}
export interface TransactionListResponse {
    transactions: Transaction[];
    summary: TransactionSummary;
}
export interface JwtPayload {
    userId: number;
    iat?: number;
    exp?: number;
}
declare global {
    namespace Express {
        interface Request {
            userId: number;
        }
    }
}
//# sourceMappingURL=index.d.ts.map