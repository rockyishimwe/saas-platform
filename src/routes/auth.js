const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateRequest } = require('../middleware/validation');
const { schemas } = require('../middleware/validation');

router.post('/register', validateRequest(schemas.auth.register), authController.register);

router.post('/login', validateRequest(schemas.auth.login), authController.login);

router.post('/forgot-password', validateRequest(schemas.auth.forgotPassword), authController.forgotPassword);

router.post('/reset-password', validateRequest(schemas.auth.resetPassword), authController.resetPassword);

router.post('/accept-invitation', authController.acceptInvitation);

router.post('/refresh-token', authController.refreshToken);

module.exports = router;