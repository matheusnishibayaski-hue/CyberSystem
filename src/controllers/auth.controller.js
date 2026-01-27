const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { query } = require('../config/db.config');

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
      'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email, created_at',
      [email, hash]
    );

    const newUser = result.rows[0];

    res.status(201).json({
      message: 'Usuário criado',
      user: {
        id: newUser.id,
        email: newUser.email,
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
        'SELECT id, email, password FROM users WHERE email = $1',
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
    let isNewUser = false;

    // Se o usuário não existe, criar automaticamente (auto-registro)
    if (!user) {
      console.log(`📝 Usuário não encontrado. Criando novo usuário para: ${email}`);
      
      // Validar senha mínima apenas para novos usuários
      if (password.length < 8) {
        return res.status(400).json({
          error: 'Validation failed',
          message: 'Senha deve ter no mínimo 8 caracteres para criar uma nova conta'
        });
      }
      
      try {
        // Hash da senha
        const hash = await bcrypt.hash(password, 12);
        
        // Criar usuário no banco de dados
        const createUserResult = await query(
          'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email, created_at',
          [email, hash]
        );
        
        user = createUserResult.rows[0];
        loginSuccess = true;
        isNewUser = true;
        
        console.log(`✅ Novo usuário criado com sucesso: ${email}`);
      } catch (createError) {
        console.error('Erro ao criar novo usuário:', createError);
        return res.status(500).json({
          error: 'Database error',
          message: 'Erro ao criar novo usuário',
          details: process.env.NODE_ENV === 'development' ? createError.message : undefined
        });
      }
    } else {
      // Usuário existe, verificar senha
      try {
        const valid = await bcrypt.compare(password, user.password);
        if (valid) {
          loginSuccess = true;
        }
      } catch (bcryptError) {
        console.error('Erro ao comparar senha:', bcryptError);
      }
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
        { userId: user.id, email: user.email },
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
      message: isNewUser ? 'Usuário criado e login realizado com sucesso' : 'Login realizado com sucesso',
      token,
      user: {
        id: user.id,
        email: user.email
      },
      isNewUser: isNewUser
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
