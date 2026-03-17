const Feedback = require('../models/Feedback');
const User = require('../models/User');
const Company = require('../models/Company');
const logger = require('../utils/logger');

//Getting Dashboard stats

const getDashboardStats = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { period = '30' } = req.query;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period));

    const totalFeedback = await Feedback.countDocuments({ companyId });
    const newFeedback = await Feedback.countDocuments({
      companyId,
      createdAt: { $gte: daysAgo }
    });

    const resolvedFeedback = await Feedback.countDocuments({
      companyId,
      status: 'resolved'
    });

    const recentlyResolved = await Feedback.countDocuments({
      companyId,
      status: 'resolved',
      updatedAt: { $gte: daysAgo }
    });

    const activeUsers = await User.countDocuments({
      companyId,
      isActive: true,
      lastLogin: { $gte: daysAgo }
    });

    const totalUsers = await User.countDocuments({ companyId });

    const feedbackTrend = await Feedback.aggregate([
      { $match: { companyId, createdAt: { $gte: daysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const categoryBreakdown = await Feedback.aggregate([
      { $match: { companyId, createdAt: { $gte: daysAgo } } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    const priorityBreakdown = await Feedback.aggregate([
      { $match: { companyId, createdAt: { $gte: daysAgo } } },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        feedback: {
          total: totalFeedback,
          new: newFeedback,
          resolved: resolvedFeedback,
          recentlyResolved,
          resolutionRate: totalFeedback > 0 ? ((resolvedFeedback / totalFeedback) * 100).toFixed(2) : 0,
        },
        users: {
          total: totalUsers,
          active: activeUsers,
          engagementRate: totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(2) : 0,
        },
        trends: {
          feedbackTrend,
          categoryBreakdown,
          priorityBreakdown,
        },
      },
    });
  } catch (error) {
    logger.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

//Getting Feedback Analytics
const getFeedbackAnalytics = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { startDate, endDate, groupBy = 'day' } = req.query;

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

    const feedbackOverTime = await Feedback.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { $dateToString: { format: groupFormat, date: '$createdAt' } },
          count: { $sum: 1 },
          categories: {
            $push: '$category'
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const statusBreakdown = await Feedback.aggregate([
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

    const topContributors = await Feedback.aggregate([
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

    res.json({
      success: true,
      data: {
        feedbackOverTime,
        statusBreakdown,
        topContributors,
      },
    });
  } catch (error) {
    logger.error('Get feedback analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
//Getting user analytics
const getUserAnalytics = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { period = '30' } = req.query;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period));

    const userActivity = await User.aggregate([
      { $match: { companyId } },
      {
        $lookup: {
          from: 'feedback',
          let: { userId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$createdBy', '$$userId'] },
                createdAt: { $gte: daysAgo }
              }
            }
          ],
          as: 'recentFeedback'
        }
      },
      {
        $project: {
          firstName: 1,
          lastName: 1,
          email: 1,
          role: 1,
          isActive: 1,
          lastLogin: 1,
          feedbackCount: { $size: '$recentFeedback' },
        }
      },
      { $sort: { feedbackCount: -1 } }
    ]);

    const roleDistribution = await User.aggregate([
      { $match: { companyId } },
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    const loginActivity = await User.aggregate([
      { $match: { companyId, lastLogin: { $gte: daysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$lastLogin' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        userActivity,
        roleDistribution,
        loginActivity,
      },
    });
  } catch (error) {
    logger.error('Get user analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
//Controlling real time information of system

const getPerformanceMetrics = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { period = '30' } = req.query;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period));

    const avgResolutionTime = await Feedback.aggregate([
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

    const responseTimeByPriority = await Feedback.aggregate([
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

    const feedbackVolume = await Feedback.aggregate([
      { $match: { companyId, createdAt: { $gte: daysAgo } } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          byCategory: {
            $push: '$category'
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        resolutionTime: avgResolutionTime[0] || { avgTime: 0, minTime: 0, maxTime: 0 },
        responseTimeByPriority,
        feedbackVolume: feedbackVolume[0] || { total: 0, byCategory: [] },
      },
    });
  } catch (error) {
    logger.error('Get performance metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = {
  getDashboardStats,
  getFeedbackAnalytics,
  getUserAnalytics,
  getPerformanceMetrics,
};