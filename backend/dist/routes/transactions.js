"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/transactions.ts
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const auth_1 = require("../middleware/auth");
const transactionController_1 = require("../controllers/transactionController");
const router = (0, express_1.Router)();
// Todas as rotas exigem JWT
router.use(auth_1.authMiddleware);
const transactionRules = [
    (0, express_validator_1.body)('type')
        .isIn(['income', 'expense'])
        .withMessage("Tipo deve ser 'income' ou 'expense'."),
    (0, express_validator_1.body)('amount')
        .isFloat({ gt: 0 })
        .withMessage('Valor deve ser um número positivo.'),
    (0, express_validator_1.body)('category')
        .trim()
        .notEmpty()
        .withMessage('Categoria é obrigatória.'),
    (0, express_validator_1.body)('date')
        .isISO8601()
        .withMessage('Data inválida. Use o formato YYYY-MM-DD.'),
    (0, express_validator_1.body)('description')
        .optional()
        .trim()
        .isLength({ max: 255 })
        .withMessage('Descrição deve ter no máximo 255 caracteres.'),
];
// Ordem importa: rota com path fixo antes da com :id
router.get('/summary/by-category', transactionController_1.byCategory);
router.get('/', transactionController_1.list);
router.post('/', transactionRules, transactionController_1.create);
router.get('/:id', transactionController_1.getOne);
router.put('/:id', transactionRules, transactionController_1.update);
router.delete('/:id', transactionController_1.remove);
exports.default = router;
//# sourceMappingURL=transactions.js.map