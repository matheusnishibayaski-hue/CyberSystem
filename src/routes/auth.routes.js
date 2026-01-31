const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const adminController = require('../controllers/admin.controller');
const auth = require('../middlewares/auth.middleware');
const role = require('../middlewares/role.middleware');

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

// Bootstrap routes (master key)
router.post('/bootstrap/validate-key', adminController.validateMasterKey);
router.post('/bootstrap/create-admin', registerValidation, authController.bootstrapAdmin);

// Admin routes
router.get('/admin/users', auth, role('admin'), adminController.getUsers);
router.post('/admin/create-user', auth, role('admin'), registerValidation, adminController.createUser);

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

router.put('/admin/users/:id', auth, role('admin'), updateUserValidation, adminController.updateUser);
router.delete('/admin/users/:id', auth, role('admin'), adminController.deleteUser);
router.patch('/admin/users/:id/toggle-status', auth, role('admin'), adminController.toggleUserStatus);
router.patch('/admin/users/:id/role', auth, role('admin'), adminController.updateUserRole);

module.exports = router;
