const { query } = require('../config/db.config');

// Estatísticas do dashboard
exports.getStats = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Contar sites monitorados
    const sitesResult = await query(
      'SELECT COUNT(*) as count FROM monitored_sites WHERE user_id = $1',
      [userId]
    );
    const sitesCount = parseInt(sitesResult.rows[0]?.count || 0);

    // Contar scans executados (logs do tipo scan)
    const scansResult = await query(
      'SELECT COUNT(*) as count FROM security_logs WHERE user_id = $1 AND log_type = $2',
      [userId, 'scan']
    );
    const scansCount = parseInt(scansResult.rows[0]?.count || 0);

    // Contar vulnerabilidades críticas (logs com severity critical ou error)
    const vulnerabilitiesResult = await query(
      `SELECT COUNT(*) as count 
       FROM security_logs 
       WHERE user_id = $1 
       AND severity IN ('critical', 'error')
       AND log_type = 'security'`,
      [userId]
    );
    const vulnerabilitiesCount = parseInt(vulnerabilitiesResult.rows[0]?.count || 0);

    // Contar alertas de hoje
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
    const alertsCount = parseInt(alertsResult.rows[0]?.count || 0);

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
    console.error('Erro ao buscar estatísticas do dashboard:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Erro ao buscar estatísticas',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Atividade recente
exports.getRecentActivity = async (req, res) => {
  try {
    const userId = req.user.userId;
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
    console.error('Erro ao buscar atividade recente:', error);
    // Se a tabela não existir, retornar array vazio
    if (error.message && error.message.includes('does not exist')) {
      return res.json({
        success: true,
        activities: []
      });
    }
    
    res.status(500).json({
      error: 'Internal server error',
      message: 'Erro ao buscar atividade recente',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Dados do gráfico de alertas por severidade (últimos 6 meses)
exports.getAlertsChart = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Calcular data de 6 meses atrás
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    sixMonthsAgo.setDate(1); // Primeiro dia do mês
    sixMonthsAgo.setHours(0, 0, 0, 0);

    // Buscar logs dos últimos 6 meses agrupados por mês e severidade
    const result = await query(
      `SELECT 
        DATE_TRUNC('month', created_at) as month,
        severity,
        COUNT(*) as count
       FROM security_logs
       WHERE user_id = $1
       AND created_at >= $2
       AND severity IN ('critical', 'error', 'warning', 'info', 'success')
       GROUP BY DATE_TRUNC('month', created_at), severity
       ORDER BY month ASC`,
      [userId, sixMonthsAgo]
    );

    // Processar dados para o formato do gráfico
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Set', 'Out', 'Nov', 'Dez'];
    const chartData = {};
    
    // Inicializar todos os meses dos últimos 6 meses com zeros
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = monthNames[monthDate.getMonth()];
      chartData[monthKey] = {
        date: monthKey,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0
      };
    }

    // Preencher com dados reais
    result.rows.forEach(row => {
      const monthDate = new Date(row.month);
      const monthKey = monthNames[monthDate.getMonth()];
      
      if (chartData[monthKey]) {
        // Mapear severidades do banco para as do gráfico
        if (row.severity === 'critical' || row.severity === 'error') {
          chartData[monthKey].critical += parseInt(row.count);
        } else if (row.severity === 'warning') {
          chartData[monthKey].high += parseInt(row.count);
        } else if (row.severity === 'info') {
          chartData[monthKey].medium += parseInt(row.count);
        } else if (row.severity === 'success') {
          chartData[monthKey].low += parseInt(row.count);
        }
      }
    });

    // Converter para array e pegar apenas os últimos 6 meses
    const chartDataArray = Object.values(chartData).slice(-6);

    res.json({
      success: true,
      data: chartDataArray
    });
  } catch (error) {
    console.error('Erro ao buscar dados do gráfico:', error);
    // Se a tabela não existir, retornar array vazio
    if (error.message && error.message.includes('does not exist')) {
      return res.json({
        success: true,
        data: []
      });
    }
    
    res.status(500).json({
      error: 'Internal server error',
      message: 'Erro ao buscar dados do gráfico',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
