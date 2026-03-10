const Feedback = require('../models/Feedback');
const User = require('../models/User');
const logger = require('../utils/logger');

class AnalyticsService {
  async getDashboardAnalytics(companyId, period = 30) {
    try {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - period);

      const [
        feedbackStats,
        userStats,
        feedbackTrend,
        categoryBreakdown,
        priorityBreakdown
      ] = await Promise.all([
        this.getFeedbackStats(companyId, period),
        this.getUserStats(companyId, period),
        this.getFeedbackTrend(companyId, period),
        this.getCategoryBreakdown(companyId, period),
        this.getPriorityBreakdown(companyId, period)
      ]);

      return {
        feedback: {
          ...feedbackStats,
          resolutionRate: feedbackStats.total > 0 ? 
            ((feedbackStats.resolved / feedbackStats.total) * 100).toFixed(2) : 0,
        },
        users: {
          ...userStats,
          engagementRate: userStats.total > 0 ? 
            ((userStats.active / userStats.total) * 100).toFixed(2) : 0,
        },
        trends: {
          feedbackTrend,
          categoryBreakdown,
          priorityBreakdown,
        },
      };
    } catch (error) {
      logger.error('AnalyticsService getDashboardAnalytics error:', error);
      throw error;
    }
  }

  async getFeedbackStats(companyId, period) {
    try {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - period);

      const [total, newFeedback, resolved, recentlyResolved] = await Promise.all([
        Feedback.countDocuments({ companyId }),
        Feedback.countDocuments({
          companyId,
          createdAt: { $gte: daysAgo }
        }),
        Feedback.countDocuments({
          companyId,
          status: 'resolved'
        }),
        Feedback.countDocuments({
          companyId,
          status: 'resolved',
          updatedAt: { $gte: daysAgo }
        })
      ]);

      return {
        total,
        new: newFeedback,
        resolved,
        recentlyResolved,
      };
    } catch (error) {
      logger.error('AnalyticsService getFeedbackStats error:', error);
      throw error;
    }
  }

  async getUserStats(companyId, period) {
    try {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - period);

      const [total, active] = await Promise.all([
        User.countDocuments({ companyId }),
        User.countDocuments({
          companyId,
          isActive: true,
          lastLogin: { $gte: daysAgo }
        })
      ]);

      return {
        total,
        active,
      };
    } catch (error) {
      logger.error('AnalyticsService getUserStats error:', error);
      throw error;
    }
  }

  async getFeedbackTrend(companyId, period) {
    try {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - period);

      return await Feedback.aggregate([
        { $match: { companyId, createdAt: { $gte: daysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]);
    } catch (error) {
      logger.error('AnalyticsService getFeedbackTrend error:', error);
      throw error;
    }
  }

  async getCategoryBreakdown(companyId, period) {
    try {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - period);

      return await Feedback.aggregate([
        { $match: { companyId, createdAt: { $gte: daysAgo } } },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 }
          }
        }
      ]);
    } catch (error) {
      logger.error('AnalyticsService getCategoryBreakdown error:', error);
      throw error;
    }
  }

  async getPriorityBreakdown(companyId, period) {
    try {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - period);

      return await Feedback.aggregate([
        { $match: { companyId, createdAt: { $gte: daysAgo } } },
        {
          $group: {
            _id: '$priority',
            count: { $sum: 1 }
          }
        }
      ]);
    } catch (error) {
      logger.error('AnalyticsService getPriorityBreakdown error:', error);
      throw error;
    }
  }

  async getFeedbackAnalytics(companyId, filters = {}) {
    try {
      const { startDate, endDate, groupBy = 'day' } = filters;

      const matchStage = { companyId };
      if (startDate || endDate) {
        matchStage.createdAt = {};
        if (startDate) matchStage.createdAt.$gte = new Date(startDate);
        if (endDate) matchStage.createdAt.$lte = new Date(endDate);
      }

      let groupFormat;
      switch (groupBy) {
        case 'hour':
          groupFormat = '%Y-%m-%d %H:00';
          break;
        case 'week':
          groupFormat = '%Y-%U';
          break;
        case 'month':
          groupFormat = '%Y-%m';
          break;
        default:
          groupFormat = '%Y-%m-%d';
      }

      const [feedbackOverTime, statusBreakdown, topContributors] = await Promise.all([
        this.getFeedbackOverTime(matchStage, groupFormat),
        this.getStatusBreakdown(matchStage),
        this.getTopContributors(matchStage)
      ]);

      return {
        feedbackOverTime,
        statusBreakdown,
        topContributors,
      };
    } catch (error) {
      logger.error('AnalyticsService getFeedbackAnalytics error:', error);
      throw error;
    }
  }

  async getFeedbackOverTime(matchStage, groupFormat) {
    return await Feedback.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { $dateToString: { format: groupFormat, date: '$createdAt' } },
          count: { $sum: 1 },
          categories: { $push: '$category' }
        }
      },
      { $sort: { _id: 1 } }
    ]);
  }

  async getStatusBreakdown(matchStage) {
    return await Feedback.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgResolutionTime: {
            $avg: {
              $cond: [
                { $eq: ['$status', 'resolved'] },
                { $subtract: ['$updatedAt', '$createdAt'] },
                null
              ]
            }
          }
        }
      }
    ]);
  }

  async getTopContributors(matchStage) {
    return await Feedback.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$createdBy',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $project: {
          count: 1,
          user: { $arrayElemAt: ['$user', 0] }
        }
      }
    ]);
  }

  async getPerformanceMetrics(companyId, period = 30) {
    try {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - period);

      const [avgResolutionTime, responseTimeByPriority, feedbackVolume] = await Promise.all([
        this.getAvgResolutionTime(companyId, daysAgo),
        this.getResponseTimeByPriority(companyId, daysAgo),
        this.getFeedbackVolume(companyId, daysAgo)
      ]);

      return {
        resolutionTime: avgResolutionTime[0] || { avgTime: 0, minTime: 0, maxTime: 0 },
        responseTimeByPriority,
        feedbackVolume: feedbackVolume[0] || { total: 0, byCategory: [] },
      };
    } catch (error) {
      logger.error('AnalyticsService getPerformanceMetrics error:', error);
      throw error;
    }
  }

  async getAvgResolutionTime(companyId, daysAgo) {
    return await Feedback.aggregate([
      {
        $match: {
          companyId,
          status: 'resolved',
          updatedAt: { $gte: daysAgo }
        }
      },
      {
        $group: {
          _id: null,
          avgTime: { $avg: { $subtract: ['$updatedAt', '$createdAt'] } },
          minTime: { $min: { $subtract: ['$updatedAt', '$createdAt'] } },
          maxTime: { $max: { $subtract: ['$updatedAt', '$createdAt'] } }
        }
      }
    ]);
  }

  async getResponseTimeByPriority(companyId, daysAgo) {
    return await Feedback.aggregate([
      {
        $match: {
          companyId,
          status: 'resolved',
          updatedAt: { $gte: daysAgo }
        }
      },
      {
        $group: {
          _id: '$priority',
          avgTime: { $avg: { $subtract: ['$updatedAt', '$createdAt'] } },
          count: { $sum: 1 }
        }
      }
    ]);
  }

  async getFeedbackVolume(companyId, daysAgo) {
    return await Feedback.aggregate([
      { $match: { companyId, createdAt: { $gte: daysAgo } } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          byCategory: { $push: '$category' }
        }
      }
    ]);
  }
}

module.exports = new AnalyticsService();