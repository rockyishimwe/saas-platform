const Feedback = require('../models/Feedback');
const User = require('../models/User');
const logger = require('../utils/logger');

const createFeedback = async (req, res) => {
  try {
    const feedbackData = {
      ...req.body,
      companyId: req.user.companyId,
      createdBy: req.user.id,
    };

    const feedback = new Feedback(feedbackData);
    await feedback.save();

    await feedback.populate('createdBy', 'firstName lastName email');

    res.status(201).json({
      success: true,
      message: 'Feedback created successfully',
      data: feedback,
    });
  } catch (error) {
    logger.error('Create feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const getFeedback = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { status, category, priority, search } = req.query;
    
    const filter = { companyId: req.user.companyId };
    
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const feedback = await Feedback.find(filter)
      .populate('createdBy', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Feedback.countDocuments(filter);

    res.json({
      success: true,
      data: {
        feedback,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    logger.error('Get feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const getFeedbackById = async (req, res) => {
  try {
    const { id } = req.params;

    const feedback = await Feedback.findOne({
      _id: id,
      companyId: req.user.companyId,
    })
    .populate('createdBy', 'firstName lastName email')
    .populate('assignedTo', 'firstName lastName email')
    .populate('comments.user', 'firstName lastName email');

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found',
      });
    }

    res.json({
      success: true,
      data: feedback,
    });
  } catch (error) {
    logger.error('Get feedback by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const updateFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const feedback = await Feedback.findOneAndUpdate(
      { _id: id, companyId: req.user.companyId },
      updates,
      { new: true, runValidators: true }
    )
    .populate('createdBy', 'firstName lastName email')
    .populate('assignedTo', 'firstName lastName email');

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found',
      });
    }

    res.json({
      success: true,
      message: 'Feedback updated successfully',
      data: feedback,
    });
  } catch (error) {
    logger.error('Update feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const deleteFeedback = async (req, res) => {
  try {
    const { id } = req.params;

    const feedback = await Feedback.findOneAndDelete({
      _id: id,
      companyId: req.user.companyId,
    });

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found',
      });
    }

    res.json({
      success: true,
      message: 'Feedback deleted successfully',
    });
  } catch (error) {
    logger.error('Delete feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    const feedback = await Feedback.findOne({
      _id: id,
      companyId: req.user.companyId,
    });

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found',
      });
    }

    feedback.comments.push({
      text,
      user: req.user.id,
      createdAt: new Date(),
    });

    await feedback.save();

    await feedback.populate('comments.user', 'firstName lastName email');

    const newComment = feedback.comments[feedback.comments.length - 1];

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: newComment,
    });
  } catch (error) {
    logger.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const assignFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { assignedTo } = req.body;

    if (assignedTo) {
      const assignedUser = await User.findOne({
        _id: assignedTo,
        companyId: req.user.companyId,
      });

      if (!assignedUser) {
        return res.status(400).json({
          success: false,
          message: 'Assigned user not found',
        });
      }
    }

    const feedback = await Feedback.findOneAndUpdate(
      { _id: id, companyId: req.user.companyId },
      { 
        assignedTo,
        status: 'in_progress',
        updatedAt: new Date(),
      },
      { new: true, runValidators: true }
    )
    .populate('assignedTo', 'firstName lastName email')
    .populate('createdBy', 'firstName lastName email');

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found',
      });
    }

    res.json({
      success: true,
      message: 'Feedback assigned successfully',
      data: feedback,
    });
  } catch (error) {
    logger.error('Assign feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const getFeedbackStats = async (req, res) => {
  try {
    const companyId = req.user.companyId;

    const totalFeedback = await Feedback.countDocuments({ companyId });
    const openFeedback = await Feedback.countDocuments({ 
      companyId, 
      status: 'open' 
    });
    const inProgressFeedback = await Feedback.countDocuments({ 
      companyId, 
      status: 'in_progress' 
    });
    const resolvedFeedback = await Feedback.countDocuments({ 
      companyId, 
      status: 'resolved' 
    });

    const categoryStats = await Feedback.aggregate([
      { $match: { companyId } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);

    const priorityStats = await Feedback.aggregate([
      { $match: { companyId } },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]);

    const recentFeedback = await Feedback.find({ companyId })
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        total: totalFeedback,
        open: openFeedback,
        inProgress: inProgressFeedback,
        resolved: resolvedFeedback,
        categoryStats,
        priorityStats,
        recentFeedback,
      },
    });
  } catch (error) {
    logger.error('Get feedback stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = {
  createFeedback,
  getFeedback,
  getFeedbackById,
  updateFeedback,
  deleteFeedback,
  addComment,
  assignFeedback,
  getFeedbackStats,
};