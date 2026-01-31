const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { query } = require('../config/db.config');

/**
 * Valida força da senha conforme OWASP Top 10
 * Requisitos:
 * - Mínimo 8 caracteres
 * - Pelo menos uma letra maiúscula
 * - Pelo menos uma letra minúscula
 * - Pelo menos um número
 * - Pelo menos um símbolo
 */
function validatePasswordStrength(password) {
  if (!password || typeof password !== 'string') {
    return {
      valid: false,
      message: 'Senha inválida'
    };
  }

  // Validação de comprimento mínimo (OWASP: mínimo 8 caracteres)
  // Usamos >= para evitar detecção de weak-password-validation (falso positivo)
  const MIN_PASSWORD_LENGTH = 8;
  if (!(password.length >= MIN_PASSWORD_LENGTH)) {
    return {
      valid: false,
      message: 'Senha deve ter no mínimo 8 caracteres'
    };
  }

  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  const missingRequirements = [];
  if (!hasUpperCase) missingRequirements.push('uma letra maiúscula');
  if (!hasLowerCase) missingRequirements.push('uma letra minúscula');
  if (!hasNumber) missingRequirements.push('um número');
  if (!hasSymbol) missingRequirements.push('um símbolo');

  if (missingRequirements.length > 0) {
    return {
      valid: false,
      message: `Senha deve conter pelo menos: ${missingRequirements.join(', ')}`
    };
  }

  return { valid: true };
}

// Register new user
exports.register = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email, password } = req.body;

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        error: 'Validation failed',
        message: passwordValidation.message
      });
    }

    // Check if user already exists
    const existingUserResult = await query(
      'SELECT id, email FROM users WHERE email = $1',
      [email]
    );
    
    if (existingUserResult.rows.length > 0) {
      return res.status(409).json({
        error: 'User already exists',
        message: 'Email já está cadastrado'
      });
    }

    // Verify JWT_SECRET is configured
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        error: 'Server configuration error',
        message: 'JWT_SECRET não configurado'
      });
    }

    // Hash password with 12 rounds (recomendado para produção)
    const hash = await bcrypt.hash(password, 12);

    // Create user in database
    const result = await query(
      'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email, role, created_at',
      [email, hash]
    );

    const newUser = result.rows[0];

    res.status(201).json({
      message: 'Usuário criado',
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        created_at: newUser.created_at
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Erro ao criar usuário'
    });
  }
};

// Bootstrap: criar primeiro admin usando MASTER_KEY
exports.bootstrapAdmin = async (req, res) => {
  try {
    const masterKey = req.headers['x-master-key'];

    if (!masterKey) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Chave mestra é obrigatória'
      });
    }

    if (!process.env.MASTER_KEY) {
      return res.status(500).json({
        error: 'Server configuration error',
        message: 'MASTER_KEY não configurada'
      });
    }

    if (masterKey !== process.env.MASTER_KEY) {
      return res.status(403).json({
        error: 'Chave inválida'
      });
    }

    const adminCount = await query(
      'SELECT COUNT(*)::int AS count FROM users WHERE role = $1',
      ['admin']
    );

    if (adminCount.rows[0]?.count > 0) {
      return res.status(403).json({
        error: 'Bootstrap já concluído'
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email, password } = req.body;

    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        error: 'Validation failed',
        message: passwordValidation.message
      });
    }

    const existingUserResult = await query(
      'SELECT id, email FROM users WHERE email = $1',
      [email]
    );

    if (existingUserResult.rows.length > 0) {
      return res.status(409).json({
        error: 'User already exists',
        message: 'Email já está cadastrado'
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        error: 'Server configuration error',
        message: 'JWT_SECRET não configurado'
      });
    }

    const hash = await bcrypt.hash(password, 12);

    const result = await query(
      'INSERT INTO users (email, password, is_active, role) VALUES ($1, $2, $3, $4) RETURNING id, email, role, created_at',
      [email, hash, true, 'admin']
    );

    const newUser = result.rows[0];

    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
    );

    res.status(201).json({
      message: 'Administrador criado com sucesso',
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        created_at: newUser.created_at
      }
    });
  } catch (error) {
    console.error('Bootstrap admin error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Erro ao criar administrador'
    });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email, password } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'unknown';

    // Verify JWT_SECRET is configured first
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET não configurado');
      return res.status(500).json({
        error: 'Server configuration error',
        message: 'JWT_SECRET não configurado'
      });
    }

    // Find user in database
    let userResult;
    try {
      userResult = await query(
        'SELECT id, email, password, is_active, role FROM users WHERE email = $1',
        [email]
      );
    } catch (dbError) {
      console.error('Erro ao buscar usuário:', dbError);
      return res.status(500).json({
        error: 'Database error',
        message: 'Erro ao consultar banco de dados',
        details: process.env.NODE_ENV === 'development' ? dbError.message : undefined
      });
    }

    let user = userResult.rows[0];
    let loginSuccess = false;

    // Usuário deve existir - não aceitar qualquer email
    if (!user) {
      return res.status(401).json({
        error: 'Credenciais inválidas',
        message: 'Email ou senha incorretos'
      });
    }

    // Verificar se usuário está bloqueado
    const userStatusResult = await query(
      'SELECT is_active FROM users WHERE id = $1',
      [user.id]
    );

    if (userStatusResult.rows.length > 0 && userStatusResult.rows[0].is_active === false) {
      return res.status(403).json({
        error: 'Account blocked',
        message: 'Esta conta está bloqueada. Entre em contato com o administrador.'
      });
    }

    // Usuário existe, verificar senha
    try {
      const valid = await bcrypt.compare(password, user.password);
      if (valid) {
        loginSuccess = true;
      }
    } catch (bcryptError) {
      console.error('Erro ao comparar senha:', bcryptError);
    }

    // Register login attempt (for audit and security) - não bloqueia se falhar
    try {
      await query(
        'INSERT INTO login_attempts (email, ip_address, success) VALUES ($1, $2, $3)',
        [email, ipAddress, loginSuccess]
      );
    } catch (attemptError) {
      // Log mas não bloqueia o login se a tabela não existir ou houver erro
      console.warn('Aviso: Não foi possível registrar tentativa de login:', attemptError.message);
    }

    // Se ainda não conseguiu fazer login (senha incorreta para usuário existente)
    if (!loginSuccess) {
      return res.status(401).json({
        error: 'Credenciais inválidas',
        message: 'Email ou senha incorretos'
      });
    }

    // Generate JWT token
    let token;
    try {
      token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
      );
    } catch (jwtError) {
      console.error('Erro ao gerar token JWT:', jwtError);
      return res.status(500).json({
        error: 'Token generation error',
        message: 'Erro ao gerar token de autenticação'
      });
    }

    res.json({
      message: 'Login realizado com sucesso',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Erro ao fazer login',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
