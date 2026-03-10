const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');
const logger = require('../utils/logger');

const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token or user not found.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token.',
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.',
      });
    }
    next();
  };
};

const companyAccess = async (req, res, next) => {
  try {
    if (req.user.role === 'admin') {
      return next();
    }

    const targetCompanyId = req.params.companyId || req.body.companyId;
    
    if (!targetCompanyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required.',
      });
    }

    if (req.user.companyId.toString() !== targetCompanyId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your own company data.',
      });
    }

    next();
  } catch (error) {
    logger.error('Company access check error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error.',
    });
  }
};

module.exports = {
  authenticate,
  authorize,
  companyAccess,
};