const User = require('../models/User');
const Company = require('../models/Company');
const Invitation = require('../models/Invitation');
const { generateToken, generateRefreshToken } = require('../utils/jwt');
const emailService = require('../utils/emailService');
const logger = require('../utils/logger');


//Registering
const register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, companyName } = req.body;
    
    console.log('Registration attempt:', { firstName, lastName, email, companyName });

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email',
      });
    }

    let company = await Company.findOne({ name: companyName });
    if (!company) {
      console.log('Creating new company:', companyName);
      company = new Company({
        name: companyName,
        settings: {
          allowInvitations: true,
          requireApproval: false,
        },
      });
      await company.save();
      console.log('Company created with ID:', company._id);
    }

    // Ensure we have the company ID
    const companyId = company._id || company.id;
    console.log('Company ID for user:', companyId);

    const user = new User({
      firstName,
      lastName,
      email,
      password,
      companyId: companyId,
      role: 'admin',
    });

    console.log('User object created, attempting to save...');
    await user.save();
    console.log('User saved successfully');

    // Update the company with the user's ID as createdBy
    if (company && !company.createdBy) {
      company.createdBy = user._id;
      await company.save();
      console.log('Company updated with createdBy');
    }

    const token = generateToken({ id: user._id });
    const refreshToken = generateRefreshToken({ id: user._id });

    user.lastLogin = new Date();
    await user.save();

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          companyId: user.companyId,
        },
        token,
        refreshToken,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    logger.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const token = generateToken({ id: user._id });
    const refreshToken = generateRefreshToken({ id: user._id });

    user.lastLogin = new Date();
    await user.save();

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          companyId: user.companyId,
        },
        token,
        refreshToken,
      },
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const resetToken = generateToken({ id: user._id }, '1h');
    
    await emailService.sendPasswordResetEmail(email, resetToken);

    res.json({
      success: true,
      message: 'Password reset email sent',
    });
  } catch (error) {
    logger.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    const { verifyToken } = require('../utils/jwt');
    const decoded = verifyToken(token);
    
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or expired token',
      });
    }

    user.password = password;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successful',
    });
  } catch (error) {
    logger.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
};

const acceptInvitation = async (req, res) => {
  try {
    const { token, firstName, lastName, password } = req.body;

    const invitation = await Invitation.findOne({ 
      token,
      status: 'pending',
      expiresAt: { $gt: new Date() }
    }).populate('companyId');

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or expired invitation',
      });
    }

    const existingUser = await User.findOne({ email: invitation.email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists',
      });
    }

    const user = new User({
      firstName,
      lastName,
      email: invitation.email,
      password,
      companyId: invitation.companyId._id,
      role: invitation.role,
    });

    await user.save();

    invitation.status = 'accepted';
    await invitation.save();

    const authToken = generateToken({ id: user._id });
    const refreshToken = generateRefreshToken({ id: user._id });

    res.json({
      success: true,
      message: 'Invitation accepted successfully',
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          companyId: user.companyId,
        },
        token: authToken,
        refreshToken,
      },
    });
  } catch (error) {
    logger.error('Accept invitation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    const { verifyRefreshToken } = require('../utils/jwt');
    const decoded = verifyRefreshToken(refreshToken);
    
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token',
      });
    }

    const newToken = generateToken({ id: user._id });
    const newRefreshToken = generateRefreshToken({ id: user._id });

    res.json({
      success: true,
      data: {
        token: newToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    logger.error('Refresh token error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid refresh token',
    });
  }
};

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
  acceptInvitation,
  refreshToken,
};