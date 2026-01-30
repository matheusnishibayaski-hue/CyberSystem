const { query } = require('../config/db.config');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');

// Validar chave mestra
exports.validateMasterKey = async (req, res) => {
  try {
    const { masterKey } = req.body;

    if (!masterKey) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Chave mestra é obrigatória'
      });
    }

    const result = await query(
      'SELECT master_key FROM admin_config ORDER BY id DESC LIMIT 1'
    );

    if (result.rows.length === 0) {
      return res.status(500).json({
        error: 'Server configuration error',
        message: 'Chave mestra não configurada no sistema'
      });
    }

    const storedKey = result.rows[0].master_key;

    if (masterKey === storedKey) {
      res.json({
        valid: true,
        message: 'Chave mestra válida'
      });
    } else {
      res.status(401).json({
        valid: false,
        message: 'Chave mestra inválida'
      });
    }
  } catch (error) {
    console.error('Erro ao validar chave mestra:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Erro ao validar chave mestra'
    });
  }
};

// Obter chave mestra (apenas para exibição - em produção, considerar remover)
exports.getMasterKey = async (req, res) => {
  try {
    const result = await query(
      'SELECT master_key FROM admin_config ORDER BY id DESC LIMIT 1'
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Chave mestra não encontrada'
      });
    }

    res.json({
      masterKey: result.rows[0].master_key
    });
  } catch (error) {
    console.error('Erro ao obter chave mestra:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Erro ao obter chave mestra'
    });
  }
};

// Listar usuários (apenas admin)
exports.getUsers = async (req, res) => {
  try {
    const result = await query(
      'SELECT id, email, is_active, created_at FROM users ORDER BY created_at DESC'
    );

    res.json({
      users: result.rows
    });
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Erro ao listar usuários'
    });
  }
};

// Criar usuário (apenas admin)
exports.createUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email, password } = req.body;

    // Validar força da senha
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        error: 'Validation failed',
        message: passwordValidation.message
      });
    }

    // Verificar se usuário já existe
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

    // Hash da senha
    const hash = await bcrypt.hash(password, 12);

    // Criar usuário
    const result = await query(
      'INSERT INTO users (email, password, is_active) VALUES ($1, $2, $3) RETURNING id, email, is_active, created_at',
      [email, hash, true]
    );

    const newUser = result.rows[0];

    res.status(201).json({
      message: 'Usuário criado com sucesso',
      user: {
        id: newUser.id,
        email: newUser.email,
        is_active: newUser.is_active,
        created_at: newUser.created_at
      }
    });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Erro ao criar usuário'
    });
  }
};

// Atualizar usuário (apenas admin)
exports.updateUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { id } = req.params;
    const { email, password } = req.body;

    // Verificar se usuário existe
    const userResult = await query(
      'SELECT id, email FROM users WHERE id = $1',
      [id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        error: 'User not found',
        message: 'Usuário não encontrado'
      });
    }

    const updates = [];
    const values = [];
    let paramCount = 1;

    // Atualizar email se fornecido
    if (email) {
      // Verificar se email já existe em outro usuário
      const emailCheck = await query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email, id]
      );
      
      if (emailCheck.rows.length > 0) {
        return res.status(409).json({
          error: 'Email already exists',
          message: 'Email já está em uso por outro usuário'
        });
      }

      updates.push(`email = $${paramCount++}`);
      values.push(email);
    }

    // Atualizar senha se fornecida
    if (password) {
      // Validar força da senha
      const passwordValidation = validatePasswordStrength(password);
      if (!passwordValidation.valid) {
        return res.status(400).json({
          error: 'Validation failed',
          message: passwordValidation.message
        });
      }

      const hash = await bcrypt.hash(password, 12);
      updates.push(`password = $${paramCount++}`);
      values.push(hash);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Nenhum campo para atualizar'
      });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING id, email, is_active, created_at, updated_at`,
      values
    );

    res.json({
      message: 'Usuário atualizado com sucesso',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Erro ao atualizar usuário'
    });
  }
};

// Excluir usuário (apenas admin)
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se usuário existe
    const userResult = await query(
      'SELECT id, email FROM users WHERE id = $1',
      [id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        error: 'User not found',
        message: 'Usuário não encontrado'
      });
    }

    // Excluir usuário
    await query('DELETE FROM users WHERE id = $1', [id]);

    res.json({
      message: 'Usuário excluído com sucesso'
    });
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Erro ao excluir usuário'
    });
  }
};

// Bloquear/Desbloquear usuário (apenas admin)
exports.toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se usuário existe
    const userResult = await query(
      'SELECT id, email, is_active FROM users WHERE id = $1',
      [id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        error: 'User not found',
        message: 'Usuário não encontrado'
      });
    }

    const currentStatus = userResult.rows[0].is_active;
    const newStatus = !currentStatus;

    // Atualizar status
    const result = await query(
      'UPDATE users SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, email, is_active, created_at, updated_at',
      [newStatus, id]
    );

    res.json({
      message: newStatus ? 'Usuário desbloqueado com sucesso' : 'Usuário bloqueado com sucesso',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao alterar status do usuário:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Erro ao alterar status do usuário'
    });
  }
};

// Função auxiliar para validar força da senha
function validatePasswordStrength(password) {
  if (!password || typeof password !== 'string') {
    return {
      valid: false,
      message: 'Senha inválida'
    };
  }

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
