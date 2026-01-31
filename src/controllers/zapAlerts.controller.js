const { query } = require('../config/db.config');
const { parseZap } = require('../../scripts/zapParser');

exports.importZapAlerts = async (req, res) => {
  try {
    const alerts = parseZap('security/zap-report.json');

    if (!alerts.length) {
      return res.json({ imported: 0 });
    }

    for (const alert of alerts) {
      await query(
        `INSERT INTO security_alerts(title, risk, url, description, solution, status, acknowledged) 
         VALUES($1, $2, $3, $4, $5, $6, $7)`,
        [alert.title, alert.risk, alert.url, alert.description, alert.solution, 'open', false]
      );
    }

    res.json({ imported: alerts.length });
  } catch (error) {
    console.error('Erro ao importar alertas do ZAP:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Erro ao importar alertas do ZAP',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
