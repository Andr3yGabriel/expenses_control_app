// src/routes/auth.ts
import { Router } from 'express';
import { body } from 'express-validator';
import { register, login, me } from '../controllers/authController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

const registerRules = [
  body('name').trim().notEmpty().withMessage('Nome é obrigatório.'),
  body('email')
    .isEmail().withMessage('E-mail inválido.')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Senha deve ter pelo menos 6 caracteres.'),
];

const loginRules = [
  body('email')
    .isEmail().withMessage('E-mail inválido.')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Senha é obrigatória.'),
];

router.post('/register', registerRules, register);
router.post('/login',    loginRules,    login);
router.get('/me',        authMiddleware, me);

export default router;
