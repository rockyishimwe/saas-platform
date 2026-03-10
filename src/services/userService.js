const User = require('../models/User');
const Invitation = require('../models/Invitation');
const { generateToken } = require('../utils/jwt');
const emailService = require('../utils/emailService');
const logger = require('../utils/logger');

class UserService {
  async createUser(userData, companyId) {
    try {
      const user = new User({
        ...userData,
        companyId,
      });

      await user.save();
      await user.populate('companyId', 'name domain');
      
      return user;
    } catch (error) {
      logger.error('UserService createUser error:', error);
      throw error;
    }
  }

  async inviteUser(email, role, companyId, invitedBy) {
    try {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new Error('User already exists with this email');
      }

      const existingInvitation = await Invitation.findOne({
        email,
        companyId,
        status: 'pending',
        expiresAt: { $gt: new Date() }
      });

      if (existingInvitation) {
        throw new Error('Invitation already sent');
      }

      const invitationToken = generateToken({ 
        email, 
        companyId, 
        role 
      }, '7d');

      const invitation = new Invitation({
        email,
        companyId,
        role,
        invitedBy,
        token: invitationToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      });

      await invitation.save();

      const company = await User.findById(invitedBy).populate('companyId');
      await emailService.sendInvitationEmail(email, invitationToken, company.companyId.name);

      return invitation;
    } catch (error) {
      logger.error('UserService inviteUser error:', error);
      throw error;
    }
  }

  async getUsersByCompany(companyId, pagination = {}) {
    try {
      const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
      
      const skip = (page - 1) * limit;
      const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

      const users = await User.find({ companyId })
        .select('-password')
        .sort(sort)
        .skip(skip)
        .limit(limit);

      const total = await User.countDocuments({ companyId });

      return {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('UserService getUsersByCompany error:', error);
      throw error;
    }
  }

  async updateUserRole(userId, role, requestUserId, requestUserRole) {
    try {
      if (requestUserRole !== 'admin') {
        throw new Error('Only admins can update user roles');
      }

      const user = await User.findByIdAndUpdate(
        userId,
        { role },
        { new: true, runValidators: true }
      ).select('-password');

      return user;
    } catch (error) {
      logger.error('UserService updateUserRole error:', error);
      throw error;
    }
  }

  async deactivateUser(userId, companyId) {
    try {
      const user = await User.findOneAndUpdate(
        { _id: userId, companyId },
        { isActive: false },
        { new: true }
      ).select('-password');

      return user;
    } catch (error) {
      logger.error('UserService deactivateUser error:', error);
      throw error;
    }
  }

  async getUserStats(companyId) {
    try {
      const stats = await User.aggregate([
        { $match: { companyId } },
        {
          $facet: {
            total: [
              { $count: "count" }
            ],
            active: [
              { $match: { isActive: true } },
              { $count: "count" }
            ],
            byRole: [
              { $group: { _id: '$role', count: { $sum: 1 } } }
            ],
            recent: [
              { $sort: { createdAt: -1 } },
              { $limit: 5 },
              {
                $project: {
                  firstName: 1,
                  lastName: 1,
                  email: 1,
                  createdAt: 1
                }
              }
            ]
          }
        }
      ]);

      return stats[0];
    } catch (error) {
      logger.error('UserService getUserStats error:', error);
      throw error;
    }
  }

  async getPendingInvitations(companyId) {
    try {
      const invitations = await Invitation.find({
        companyId,
        status: 'pending',
        expiresAt: { $gt: new Date() }
      })
      .populate('invitedBy', 'firstName lastName email')
      .sort({ createdAt: -1 });

      return invitations;
    } catch (error) {
      logger.error('UserService getPendingInvitations error:', error);
      throw error;
    }
  }

  async cancelInvitation(invitationId, companyId) {
    try {
      const invitation = await Invitation.findOneAndUpdate(
        { 
          _id: invitationId, 
          companyId,
          status: 'pending'
        },
        { status: 'cancelled' },
        { new: true }
      );

      return invitation;
    } catch (error) {
      logger.error('UserService cancelInvitation error:', error);
      throw error;
    }
  }
}

module.exports = new UserService();