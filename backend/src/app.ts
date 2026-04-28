// src/app.ts
import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import authRoutes        from './routes/auth';
import transactionRoutes from './routes/transactions';

export function createApp(): Application {
  const app = express();

  // ── Middlewares globais ──────────────────────────────────────────────────────
  app.use(cors({
    origin: '*', // em produção: substitua pelo IP do servidor onde o app conecta
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  app.use(express.json());

  // ── Rotas ────────────────────────────────────────────────────────────────────
  app.use('/auth',         authRoutes);
  app.use('/transactions', transactionRoutes);

  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // 404
  app.use((req: Request, res: Response) => {
    res.status(404).json({ error: `Rota ${req.method} ${req.path} não encontrada.` });
  });

  // Handler de erros global
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Erro interno no servidor.' });
  });

  return app;
}
