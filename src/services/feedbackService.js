const Feedback = require('../models/Feedback');
const User = require('../models/User');
const logger = require('../utils/logger');

class FeedbackService {
  async createFeedback(feedbackData, userId, companyId) {
    try {
      const feedback = new Feedback({
        ...feedbackData,
        companyId,
        createdBy: userId,
      });

      await feedback.save();
      await feedback.populate('createdBy', 'firstName lastName email');
      
      return feedback;
    } catch (error) {
      logger.error('FeedbackService createFeedback error:', error);
      throw error;
    }
  }

  async getFeedbackByCompany(companyId, filters = {}, pagination = {}) {
    try {
      const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
      const { status, category, priority, search } = filters;
      
      const filter = { companyId };
      
      if (status) filter.status = status;
      if (category) filter.category = category;
      if (priority) filter.priority = priority;
      if (search) {
        filter.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ];
      }

      const skip = (page - 1) * limit;
      const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

      const feedback = await Feedback.find(filter)
        .populate('createdBy', 'firstName lastName email')
        .populate('assignedTo', 'firstName lastName email')
        .sort(sort)
        .skip(skip)
        .limit(limit);

      const total = await Feedback.countDocuments(filter);

      return {
        feedback,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('FeedbackService getFeedbackByCompany error:', error);
      throw error;
    }
  }

  async updateFeedbackStatus(feedbackId, status, userId) {
    try {
      const feedback = await Feedback.findByIdAndUpdate(
        feedbackId,
        { 
          status,
          updatedAt: new Date(),
        },
        { new: true, runValidators: true }
      )
      .populate('createdBy', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email');

      return feedback;
    } catch (error) {
      logger.error('FeedbackService updateFeedbackStatus error:', error);
      throw error;
    }
  }

  async assignFeedback(feedbackId, assignedToId, companyId) {
    try {
      if (assignedToId) {
        const assignedUser = await User.findOne({
          _id: assignedToId,
          companyId,
        });

        if (!assignedUser) {
          throw new Error('Assigned user not found');
        }
      }

      const feedback = await Feedback.findByIdAndUpdate(
        feedbackId,
        { 
          assignedTo: assignedToId,
          status: 'in_progress',
          updatedAt: new Date(),
        },
        { new: true, runValidators: true }
      )
      .populate('assignedTo', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email');

      return feedback;
    } catch (error) {
      logger.error('FeedbackService assignFeedback error:', error);
      throw error;
    }
  }

  async addComment(feedbackId, text, userId) {
    try {
      const feedback = await Feedback.findById(feedbackId);

      if (!feedback) {
        throw new Error('Feedback not found');
      }

      feedback.comments.push({
        text,
        user: userId,
        createdAt: new Date(),
      });

      await feedback.save();
      await feedback.populate('comments.user', 'firstName lastName email');

      const newComment = feedback.comments[feedback.comments.length - 1];
      return newComment;
    } catch (error) {
      logger.error('FeedbackService addComment error:', error);
      throw error;
    }
  }

  async getFeedbackStats(companyId, period = 30) {
    try {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - period);

      const stats = await Feedback.aggregate([
        { $match: { companyId } },
        {
          $facet: {
            total: [
              { $count: "count" }
            ],
            byStatus: [
              { $group: { _id: '$status', count: { $sum: 1 } } }
            ],
            byCategory: [
              { $group: { _id: '$category', count: { $sum: 1 } } }
            ],
            byPriority: [
              { $group: { _id: '$priority', count: { $sum: 1 } } }
            ],
            recent: [
              { $match: { createdAt: { $gte: daysAgo } } },
              { $count: "count" }
            ],
            resolved: [
              { $match: { status: 'resolved' } },
              { $count: "count" }
            ]
          }
        }
      ]);

      return stats[0];
    } catch (error) {
      logger.error('FeedbackService getFeedbackStats error:', error);
      throw error;
    }
  }
}

module.exports = new FeedbackService();