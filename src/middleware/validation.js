const Joi = require('joi');
const logger = require('../utils/logger');

const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      logger.warn('Validation error:', errorMessage);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: errorMessage,
      });
    }
    
    next();
  };
};

const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.query);
    
    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      logger.warn('Query validation error:', errorMessage);
      return res.status(400).json({
        success: false,
        message: 'Query validation error',
        error: errorMessage,
      });
    }
    
    next();
  };
};

const validateParams = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.params);
    
    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      logger.warn('Params validation error:', errorMessage);
      return res.status(400).json({
        success: false,
        message: 'Params validation error',
        error: errorMessage,
      });
    }
    
    next();
  };
};

const schemas = {
  auth: {
    register: Joi.object({
      firstName: Joi.string().min(2).max(50).required(),
      lastName: Joi.string().min(2).max(50).required(),
      email: Joi.string().email().required(),
      password: Joi.string().min(6).required(),
      companyName: Joi.string().min(2).max(100).required(),
    }),
    
    login: Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().required(),
    }),
    
    forgotPassword: Joi.object({
      email: Joi.string().email().required(),
    }),
    
    resetPassword: Joi.object({
      token: Joi.string().required(),
      password: Joi.string().min(6).required(),
    }),
  },
  
  user: {
    update: Joi.object({
      firstName: Joi.string().min(2).max(50),
      lastName: Joi.string().min(2).max(50),
      role: Joi.string().valid('admin', 'manager', 'member'),
      isActive: Joi.boolean(),
    }),
    
    invite: Joi.object({
      email: Joi.string().email().required(),
      role: Joi.string().valid('admin', 'manager', 'member').default('member'),
    }),
  },
  
  company: {
    create: Joi.object({
      name: Joi.string().min(2).max(100).required(),
      domain: Joi.string().domain(),
      settings: Joi.object({
        allowInvitations: Joi.boolean().default(true),
        requireApproval: Joi.boolean().default(false),
      }),
    }),
    
    update: Joi.object({
      name: Joi.string().min(2).max(100),
      domain: Joi.string().domain(),
      settings: Joi.object({
        allowInvitations: Joi.boolean(),
        requireApproval: Joi.boolean(),
      }),
    }),
  },
  
  feedback: {
    create: Joi.object({
      title: Joi.string().min(1).max(200).required(),
      description: Joi.string().min(1).max(2000).required(),
      category: Joi.string().valid('bug', 'feature', 'improvement', 'other').required(),
      priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium'),
      tags: Joi.array().items(Joi.string().max(50)).max(10),
    }),
    
    update: Joi.object({
      title: Joi.string().min(1).max(200),
      description: Joi.string().min(1).max(2000),
      category: Joi.string().valid('bug', 'feature', 'improvement', 'other'),
      priority: Joi.string().valid('low', 'medium', 'high', 'urgent'),
      status: Joi.string().valid('open', 'in_progress', 'resolved', 'closed'),
      tags: Joi.array().items(Joi.string().max(50)).max(10),
    }),
  },
  
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sortBy: Joi.string(),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  }),
  
  objectId: Joi.object({
    id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
  }),
};

module.exports = {
  validateRequest,
  validateQuery,
  validateParams,
  schemas,
};