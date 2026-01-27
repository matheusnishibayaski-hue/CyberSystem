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

// Dados do gráfico de alertas por severidade (últimos 6 meses)
exports.getAlertsChart = async (req, res) => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.json({
        success: true,
        data: []
      });
    }
    
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
