const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const sitesController = require('../controllers/sites.controller');
const logsController = require('../controllers/logs.controller');
const dashboardController = require('../controllers/dashboard.controller');

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

module.exports = router;
