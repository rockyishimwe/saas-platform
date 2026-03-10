const User = require('../models/User');
const Invitation = require('../models/Invitation');
const { generateToken } = require('../utils/jwt');
const emailService = require('../utils/emailService');
const logger = require('../utils/logger');

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('companyId', 'name domain');
    
    res.json({
      success: true,
      data: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { firstName, lastName },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const getCompanyUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const users = await User.find({ companyId: req.user.companyId })
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments({ companyId: req.user.companyId });

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    logger.error('Get company users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const inviteUser = async (req, res) => {
  try {
    const { email, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email',
      });
    }

    const existingInvitation = await Invitation.findOne({
      email,
      companyId: req.user.companyId,
      status: 'pending',
      expiresAt: { $gt: new Date() }
    });

    if (existingInvitation) {
      return res.status(400).json({
        success: false,
        message: 'Invitation already sent',
      });
    }

    const invitationToken = generateToken({ 
      email, 
      companyId: req.user.companyId, 
      role 
    }, '7d');

    const invitation = new Invitation({
      email,
      companyId: req.user.companyId,
      role,
      invitedBy: req.user.id,
      token: invitationToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    await invitation.save();

    const company = await User.findById(req.user.id).populate('companyId');
    await emailService.sendInvitationEmail(email, invitationToken, company.companyId.name);

    res.status(201).json({
      success: true,
      message: 'Invitation sent successfully',
    });
  } catch (error) {
    logger.error('Invite user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (req.user.role !== 'admin' && updates.role) {
      return res.status(403).json({
        success: false,
        message: 'Only admins can update user roles',
      });
    }

    const user = await User.findOneAndUpdate(
      { _id: id, companyId: req.user.companyId },
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      message: 'User updated successfully',
      data: user,
    });
  } catch (error) {
    logger.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.id === id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account',
      });
    }

    const user = await User.findOneAndDelete({
      _id: id,
      companyId: req.user.companyId,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    logger.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const getInvitations = async (req, res) => {
  try {
    const invitations = await Invitation.find({
      companyId: req.user.companyId,
      status: 'pending',
      expiresAt: { $gt: new Date() }
    })
    .populate('invitedBy', 'firstName lastName email')
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: invitations,
    });
  } catch (error) {
    logger.error('Get invitations error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const cancelInvitation = async (req, res) => {
  try {
    const { id } = req.params;

    const invitation = await Invitation.findOneAndUpdate(
      { 
        _id: id, 
        companyId: req.user.companyId,
        status: 'pending'
      },
      { status: 'cancelled' }
    );

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found',
      });
    }

    res.json({
      success: true,
      message: 'Invitation cancelled successfully',
    });
  } catch (error) {
    logger.error('Cancel invitation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getCompanyUsers,
  inviteUser,
  updateUser,
  deleteUser,
  getInvitations,
  cancelInvitation,
};