const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');
const { validateRequest, validateQuery, validateParams } = require('../middleware/validation');
const { schemas } = require('../middleware/validation');

router.use(authenticate);

router.get('/profile', userController.getProfile);

router.put('/profile', validateRequest(schemas.user.update), userController.updateProfile);

router.get('/company', validateQuery(schemas.pagination), userController.getCompanyUsers);

router.post('/invite', 
  authorize('admin', 'manager'),
  validateRequest(schemas.user.invite),
  userController.inviteUser
);

router.get('/invitations', authorize('admin', 'manager'), userController.getInvitations);

router.delete('/invitations/:id', 
  authorize('admin', 'manager'),
  validateParams(schemas.objectId),
  userController.cancelInvitation
);

router.put('/:id', 
  authorize('admin'),
  validateParams(schemas.objectId),
  validateRequest(schemas.user.update),
  userController.updateUser
);

router.delete('/:id', 
  authorize('admin'),
  validateParams(schemas.objectId),
  userController.deleteUser
);

module.exports = router;