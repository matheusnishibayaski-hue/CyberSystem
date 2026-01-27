const jwt = require('jsonwebtoken');

// Middleware de autenticação JWT
module.exports = (req, res, next) => {
  // Extrai o token do header Authorization
  const token = req.headers.authorization?.split(' ')[1];

  // Verifica se o token existe
  if (!token) {
    return res.status(401).json({ error: 'Token ausente' });
  }

  // Verifica se JWT_SECRET está configurado
  if (!process.env.JWT_SECRET) {
    return res.status(500).json({
      error: 'Erro de configuração',
      message: 'JWT_SECRET não configurado'
    });
  }

  try {
    // Verifica e decodifica o token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Adiciona os dados do usuário decodificado à requisição
    req.user = decoded;
    
    // Continua para o próximo middleware/controller
    next();
  } catch (error) {
    // Trata diferentes tipos de erro
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expirado',
        message: 'Sua sessão expirou. Faça login novamente.'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Token inválido',
        message: 'Token malformado ou inválido'
      });
    }

    // Erro genérico
    return res.status(401).json({ error: 'Token inválido' });
  }
};
