const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const adminController = require('../controllers/admin.controller');

// Validation rules
const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email inválido'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Senha deve ter no mínimo 8 caracteres')
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email inválido'),
  body('password')
    .notEmpty()
    .withMessage('Senha é obrigatória')
];

// Routes
router.post('/register', registerValidation, authController.register);
router.post('/login', loginValidation, authController.login);

// Admin routes (sem autenticação JWT, apenas validação de chave mestra)
router.post('/admin/validate-key', adminController.validateMasterKey);
router.get('/admin/master-key', adminController.getMasterKey);
router.get('/admin/users', adminController.getUsers);
router.post('/admin/create-user', registerValidation, adminController.createUser);

// Validação para atualização (email opcional, senha opcional)
const updateUserValidation = [
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Email inválido'),
  body('password')
    .optional()
    .isLength({ min: 8 })
    .withMessage('Senha deve ter no mínimo 8 caracteres')
];

router.put('/admin/users/:id', updateUserValidation, adminController.updateUser);
router.delete('/admin/users/:id', adminController.deleteUser);
router.patch('/admin/users/:id/toggle-status', adminController.toggleUserStatus);

module.exports = router;
