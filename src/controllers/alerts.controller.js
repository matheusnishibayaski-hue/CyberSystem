const { query } = require('../config/db.config');

// Lista alertas com filtros opcionais
exports.list = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 100;
    const statusFilter = req.query.status;
    const riskFilter = req.query.risk;

    const whereParts = [];
    const params = [];
    let paramIndex = 1;

    // Status default: open
    if (!statusFilter || statusFilter === 'open') {
      whereParts.push(`COALESCE(status, 'open') = $${paramIndex++}`);
      params.push('open');
    } else if (statusFilter !== 'all') {
      whereParts.push(`COALESCE(status, 'open') = $${paramIndex++}`);
      params.push(statusFilter);
    }

    if (riskFilter && riskFilter !== 'all') {
      const riskValues = riskFilter.split(',').map((risk) => risk.trim()).filter(Boolean);
      if (riskValues.length > 0) {
        const riskConditions = riskValues.map(() => `risk ILIKE $${paramIndex++}`);
        params.push(...riskValues.map((risk) => `%${risk}%`));
        whereParts.push(`(${riskConditions.join(' OR ')})`);
      }
    }

    const whereClause = whereParts.length > 0 ? `WHERE ${whereParts.join(' AND ')}` : '';

    params.push(limit);
    const limitParam = paramIndex++;

    const result = await query(
      `SELECT id, title, risk, url, description, solution, status, acknowledged, created_at
       FROM security_alerts
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${limitParam}`,
      params
    );

    res.json({
      alerts: result.rows || []
    });
  } catch (error) {
    if (error.message && error.message.includes('does not exist')) {
      return res.json({ alerts: [] });
    }

    console.error('Erro ao buscar alertas:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Erro ao buscar alertas',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Atualiza status de um alerta
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const allowedStatuses = ['open', 'accepted', 'resolved'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Status inválido'
      });
    }

    const acknowledged = status !== 'open';

    const result = await query(
      `UPDATE security_alerts
       SET status = $1, acknowledged = $2
       WHERE id = $3
       RETURNING id, title, risk, url, description, solution, status, acknowledged, created_at`,
      [status, acknowledged, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Alerta não encontrado'
      });
    }

    res.json({
      success: true,
      alert: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao atualizar alerta:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Erro ao atualizar alerta'
    });
  }
};
