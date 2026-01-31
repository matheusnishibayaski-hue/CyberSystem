const { query } = require('../config/db.config');

// Estatísticas do dashboard
exports.getStats = async (req, res) => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.json({
        success: true,
        stats: {
          sites: 0,
          scans: 0,
          vulnerabilities: 0,
          alerts: 0
        }
      });
    }

    // Contar sites monitorados (com tratamento de erro)
    let sitesCount = 0;
    try {
      const sitesResult = await query(
        'SELECT COUNT(*) as count FROM monitored_sites WHERE user_id = $1',
        [userId]
      );
      sitesCount = parseInt(sitesResult.rows[0]?.count || 0);
    } catch (err) {
      // Tabela pode não existir - usar 0
    }

    // Contar scans executados (logs do tipo scan) - com tratamento de erro
    let scansCount = 0;
    try {
      const scansResult = await query(
        'SELECT COUNT(*) as count FROM security_logs WHERE user_id = $1 AND log_type = $2',
        [userId, 'scan']
      );
      scansCount = parseInt(scansResult.rows[0]?.count || 0);
    } catch (err) {
      // Tabela pode não existir - usar 0
    }

    // Contar vulnerabilidades críticas - com tratamento de erro
    let vulnerabilitiesCount = 0;
    try {
      const vulnerabilitiesResult = await query(
        `SELECT COUNT(*) as count 
         FROM security_logs 
         WHERE user_id = $1 
         AND severity IN ('critical', 'error')
         AND log_type = 'security'`,
        [userId]
      );
      vulnerabilitiesCount = parseInt(vulnerabilitiesResult.rows[0]?.count || 0);
    } catch (err) {
      // Tabela pode não existir - usar 0
    }

    // Contar alertas de hoje - com tratamento de erro
    let alertsCount = 0;
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const alertsResult = await query(
        `SELECT COUNT(*) as count 
         FROM security_logs 
         WHERE user_id = $1 
         AND created_at >= $2
         AND severity IN ('warning', 'error', 'critical')`,
        [userId, today]
      );
      alertsCount = parseInt(alertsResult.rows[0]?.count || 0);
    } catch (err) {
      // Tabela pode não existir - usar 0
    }

    res.json({
      success: true,
      stats: {
        sites: sitesCount,
        scans: scansCount,
        vulnerabilities: vulnerabilitiesCount,
        alerts: alertsCount
      }
    });
  } catch (error) {
    // Log apenas em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.error('Erro ao buscar estatísticas do dashboard:', error);
    }
    // Retornar estatísticas vazias em caso de erro (não quebrar o frontend)
    res.json({
      success: true,
      stats: {
        sites: 0,
        scans: 0,
        vulnerabilities: 0,
        alerts: 0
      }
    });
  }
};

// Atividade recente
exports.getRecentActivity = async (req, res) => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.json({
        success: true,
        activities: []
      });
    }
    const limit = parseInt(req.query.limit) || 5;

    const result = await query(
      `SELECT 
        sl.id,
        sl.log_type,
        sl.severity,
        sl.message,
        sl.created_at,
        ms.url as site_url,
        ms.name as site_name
       FROM security_logs sl
       LEFT JOIN monitored_sites ms ON sl.site_id = ms.id
       WHERE sl.user_id = $1
       ORDER BY sl.created_at DESC
       LIMIT $2`,
      [userId, limit]
    );

    res.json({
      success: true,
      activities: result.rows || []
    });
  } catch (error) {
    // Log apenas em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.error('Erro ao buscar atividade recente:', error);
    }
    // Se a tabela não existir ou qualquer erro de banco, retornar array vazio
    if (error.message && (error.message.includes('does not exist') || error.message.includes('relation') || error.message.includes('table'))) {
      return res.json({
        success: true,
        activities: []
      });
    }
    
    // Retornar array vazio em caso de erro (não quebrar o frontend)
    res.json({
      success: true,
      activities: []
    });
  }
};

// Dados do gráfico de alertas por severidade (últimos 30 dias)
exports.getAlertsChart = async (req, res) => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.json({
        success: true,
        data: []
      });
    }
    
    // Calcular data de 30 dias atrás
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    // Buscar logs dos últimos 30 dias agrupados por dia e severidade
    const result = await query(
      `SELECT 
        DATE_TRUNC('day', created_at) as day,
        severity,
        COUNT(*) as count
       FROM security_logs
       WHERE user_id = $1
       AND created_at >= $2
       AND severity IN ('critical', 'error', 'warning', 'info', 'success')
       GROUP BY DATE_TRUNC('day', created_at), severity
       ORDER BY day ASC`,
      [userId, thirtyDaysAgo]
    );

    const chartData = {};
    
    // Inicializar todos os dias dos últimos 30 dias com zeros
    for (let i = 29; i >= 0; i--) {
      const dayDate = new Date(now);
      dayDate.setDate(now.getDate() - i);
      const dayKey = dayDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      chartData[dayKey] = {
        date: dayKey,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0
      };
    }

    // Preencher com dados reais
    result.rows.forEach(row => {
      const dayDate = new Date(row.day);
      const dayKey = dayDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      
      if (chartData[dayKey]) {
        // Mapear severidades do banco para as do gráfico
        if (row.severity === 'critical' || row.severity === 'error') {
          chartData[dayKey].critical += parseInt(row.count);
        } else if (row.severity === 'warning') {
          chartData[dayKey].high += parseInt(row.count);
        } else if (row.severity === 'info') {
          chartData[dayKey].medium += parseInt(row.count);
        } else if (row.severity === 'success') {
          chartData[dayKey].low += parseInt(row.count);
        }
      }
    });

    const chartDataArray = Object.values(chartData);

    res.json({
      success: true,
      data: chartDataArray
    });
  } catch (error) {
    // Log apenas em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.error('Erro ao buscar dados do gráfico:', error);
    }
    // Se a tabela não existir ou qualquer erro de banco, retornar array vazio
    if (error.message && (error.message.includes('does not exist') || error.message.includes('relation') || error.message.includes('table'))) {
      return res.json({
        success: true,
        data: []
      });
    }
    
    // Retornar array vazio em caso de erro (não quebrar o frontend)
    res.json({
      success: true,
      data: []
    });
  }
};
