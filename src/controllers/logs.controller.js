const { query } = require('../config/db.config');

// Listar logs de segurança
exports.getLogs = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { 
      limit = 50, 
      offset = 0, 
      severity, 
      log_type,
      site_id 
    } = req.query;

    // Construir cláusula WHERE e parâmetros
    let whereClause = 'WHERE sl.user_id = $1';
    const params = [userId];
    let paramCount = 2;

    if (severity) {
      whereClause += ` AND sl.severity = $${paramCount++}`;
      params.push(severity);
    }

    if (log_type) {
      whereClause += ` AND sl.log_type = $${paramCount++}`;
      params.push(log_type);
    }

    if (site_id) {
      whereClause += ` AND sl.site_id = $${paramCount++}`;
      params.push(parseInt(site_id));
    }

    // Parâmetros para LIMIT e OFFSET
    const limitParam = paramCount++;
    const offsetParam = paramCount++;
    const limitValue = parseInt(limit) || 50;
    const offsetValue = parseInt(offset) || 0;
    
    params.push(limitValue);
    params.push(offsetValue);

    // Query principal
    const result = await query(
      `SELECT 
        sl.id, 
        sl.log_type, 
        sl.severity, 
        sl.message, 
        sl.details, 
        sl.ip_address, 
        sl.created_at,
        ms.url as site_url,
        ms.name as site_name
       FROM security_logs sl
       LEFT JOIN monitored_sites ms ON sl.site_id = ms.id
       ${whereClause}
       ORDER BY sl.created_at DESC
       LIMIT $${limitParam} OFFSET $${offsetParam}`,
      params
    );

    // Parâmetros para contagem (sem limit e offset)
    const countParams = params.slice(0, params.length - 2);
    
    // Contar total de logs
    const countResult = await query(
      `SELECT COUNT(*) as total 
       FROM security_logs sl
       ${whereClause}`,
      countParams
    );

    res.json({
      success: true,
      logs: result.rows || [],
      total: parseInt(countResult.rows[0]?.total || 0),
      limit: limitValue,
      offset: offsetValue
    });
  } catch (error) {
    console.error('Erro ao buscar logs:', error);
    console.error('Stack trace:', error.stack);
    
    // Se a tabela não existir, retornar array vazio em vez de erro
    if (error.message && error.message.includes('does not exist')) {
      console.warn('Tabela security_logs não encontrada. Retornando array vazio.');
      return res.json({
        success: true,
        logs: [],
        total: 0,
        limit: parseInt(req.query.limit || 50),
        offset: parseInt(req.query.offset || 0)
      });
    }
    
    res.status(500).json({
      error: 'Internal server error',
      message: 'Erro ao buscar logs de segurança',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Criar novo log (para uso interno ou testes)
exports.createLog = async (req, res) => {
  try {
    const { 
      site_id, 
      log_type, 
      severity = 'info', 
      message, 
      details,
      ip_address 
    } = req.body;
    const userId = req.user.userId;

    if (!log_type || !message) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'log_type e message são obrigatórios'
      });
    }

    const result = await query(
      `INSERT INTO security_logs 
       (site_id, log_type, severity, message, details, ip_address, user_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING id, log_type, severity, message, details, ip_address, created_at`,
      [site_id || null, log_type, severity, message, details ? JSON.stringify(details) : null, ip_address || req.ip, userId]
    );

    res.status(201).json({
      success: true,
      message: 'Log criado com sucesso',
      log: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao criar log:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Erro ao criar log'
    });
  }
};

// Estatísticas de logs
exports.getLogStats = async (req, res) => {
  try {
    const userId = req.user.userId;

    const stats = await query(
      `SELECT 
        severity,
        COUNT(*) as count
       FROM security_logs
       WHERE user_id = $1
       GROUP BY severity`,
      [userId]
    );

    const typeStats = await query(
      `SELECT 
        log_type,
        COUNT(*) as count
       FROM security_logs
       WHERE user_id = $1
       GROUP BY log_type
       ORDER BY count DESC
       LIMIT 10`,
      [userId]
    );

    res.json({
      success: true,
      bySeverity: stats.rows,
      byType: typeStats.rows
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas de logs:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Erro ao buscar estatísticas'
    });
  }
};
