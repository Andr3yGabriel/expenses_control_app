"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/auth.ts
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const authController_1 = require("../controllers/authController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const registerRules = [
    (0, express_validator_1.body)('name').trim().notEmpty().withMessage('Nome é obrigatório.'),
    (0, express_validator_1.body)('email')
        .isEmail().withMessage('E-mail inválido.')
        .normalizeEmail(),
    (0, express_validator_1.body)('password')
        .isLength({ min: 6 })
        .withMessage('Senha deve ter pelo menos 6 caracteres.'),
];
const loginRules = [
    (0, express_validator_1.body)('email')
        .isEmail().withMessage('E-mail inválido.')
        .normalizeEmail(),
    (0, express_validator_1.body)('password')
        .notEmpty().withMessage('Senha é obrigatória.'),
];
router.post('/register', registerRules, authController_1.register);
router.post('/login', loginRules, authController_1.login);
router.get('/me', auth_1.authMiddleware, authController_1.me);
exports.default = router;
//# sourceMappingURL=auth.js.map