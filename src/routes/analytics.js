const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/dashboard', 
  authorize('admin', 'manager'),
  analyticsController.getDashboardStats
);

router.get('/feedback', 
  authorize('admin', 'manager'),
  analyticsController.getFeedbackAnalytics
);

router.get('/users', 
  authorize('admin', 'manager'),
  analyticsController.getUserAnalytics
);

router.get('/performance', 
  authorize('admin', 'manager'),
  analyticsController.getPerformanceMetrics
);

module.exports = router;