// src/routes/transactions.ts
import { Router } from 'express';
import { body } from 'express-validator';
import { authMiddleware } from '../middleware/auth';
import {
  list,
  create,
  getOne,
  update,
  remove,
  byCategory,
} from '../controllers/transactionController';

const router = Router();

// Todas as rotas exigem JWT
router.use(authMiddleware);

const transactionRules = [
  body('type')
    .isIn(['income', 'expense'])
    .withMessage("Tipo deve ser 'income' ou 'expense'."),
  body('amount')
    .isFloat({ gt: 0 })
    .withMessage('Valor deve ser um número positivo.'),
  body('category')
    .trim()
    .notEmpty()
    .withMessage('Categoria é obrigatória.'),
  body('date')
    .isISO8601()
    .withMessage('Data inválida. Use o formato YYYY-MM-DD.'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Descrição deve ter no máximo 255 caracteres.'),
];

// Ordem importa: rota com path fixo antes da com :id
router.get('/summary/by-category', byCategory);

router.get('/',      list);
router.post('/',     transactionRules, create);
router.get('/:id',   getOne);
router.put('/:id',   transactionRules, update);
router.delete('/:id', remove);

export default router;
