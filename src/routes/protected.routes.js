const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const sitesController = require('../controllers/sites.controller');
const logsController = require('../controllers/logs.controller');
const dashboardController = require('../controllers/dashboard.controller');
const scansController = require('../controllers/scans.controller');

// Rotas de perfil
router.get('/profile', authMiddleware, (req, res) => {
  res.json({
    message: 'Perfil do usuário',
    user: {
      userId: req.user.userId,
      email: req.user.email
    }
  });
});

// Rotas de dashboard
router.get('/dashboard/stats', authMiddleware, dashboardController.getStats);
router.get('/dashboard/activity', authMiddleware, dashboardController.getRecentActivity);
router.get('/dashboard/alerts-chart', authMiddleware, dashboardController.getAlertsChart);

// Rotas de sites monitorados
router.get('/sites', authMiddleware, sitesController.getSites);
router.post('/sites', authMiddleware, sitesController.addSite);
router.put('/sites/:id', authMiddleware, sitesController.updateSite);
router.delete('/sites/:id', authMiddleware, sitesController.deleteSite);

// Rotas de logs de segurança
router.get('/logs', authMiddleware, logsController.getLogs);
router.post('/logs', authMiddleware, logsController.createLog);
router.get('/logs/stats', authMiddleware, logsController.getLogStats);

// Rotas de scans de segurança
router.post('/scans/security', authMiddleware, scansController.runSecurityScan);
router.post('/scans/zap', authMiddleware, scansController.runZapScan);
router.get('/scans/reports', authMiddleware, scansController.getScanReports);
router.get('/scans/reports/:reportType', authMiddleware, scansController.downloadReport);

module.exports = router;
