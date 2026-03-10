const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const { authenticate, authorize } = require('../middleware/auth');
const { validateRequest, validateQuery, validateParams } = require('../middleware/validation');
const { schemas } = require('../middleware/validation');

router.use(authenticate);

router.post('/', 
  validateRequest(schemas.feedback.create),
  feedbackController.createFeedback
);

router.get('/', 
  validateQuery(schemas.pagination),
  feedbackController.getFeedback
);

router.get('/stats', 
  authorize('admin', 'manager'),
  feedbackController.getFeedbackStats
);

router.get('/:id', 
  validateParams(schemas.objectId),
  feedbackController.getFeedbackById
);

router.put('/:id', 
  validateParams(schemas.objectId),
  validateRequest(schemas.feedback.update),
  feedbackController.updateFeedback
);

router.delete('/:id', 
  authorize('admin', 'manager'),
  validateParams(schemas.objectId),
  feedbackController.deleteFeedback
);

router.post('/:id/comments', 
  validateParams(schemas.objectId),
  validateRequest({ text: require('joi').string().required() }),
  feedbackController.addComment
);

router.put('/:id/assign', 
  authorize('admin', 'manager'),
  validateParams(schemas.objectId),
  validateRequest({ 
    assignedTo: require('joi').string().pattern(/^[0-9a-fA-F]{24}$/).allow(null) 
  }),
  feedbackController.assignFeedback
);

module.exports = router;