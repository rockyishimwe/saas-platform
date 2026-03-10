const Company = require('../models/Company');
const User = require('../models/User');
const logger = require('../utils/logger');

const getCompany = async (req, res) => {
  try {
    const company = await Company.findById(req.user.companyId)
      .populate('createdBy', 'firstName lastName email');

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found',
      });
    }

    res.json({
      success: true,
      data: company,
    });
  } catch (error) {
    logger.error('Get company error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const updateCompany = async (req, res) => {
  try {
    const updates = req.body;
    
    const company = await Company.findByIdAndUpdate(
      req.user.companyId,
      updates,
      { new: true, runValidators: true }
    ).populate('createdBy', 'firstName lastName email');

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found',
      });
    }

    res.json({
      success: true,
      message: 'Company updated successfully',
      data: company,
    });
  } catch (error) {
    logger.error('Update company error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const getCompanyStats = async (req, res) => {
  try {
    const companyId = req.user.companyId;

    const totalUsers = await User.countDocuments({ companyId });
    const activeUsers = await User.countDocuments({ 
      companyId, 
      isActive: true 
    });
    const adminUsers = await User.countDocuments({ 
      companyId, 
      role: 'admin' 
    });
    const managerUsers = await User.countDocuments({ 
      companyId, 
      role: 'manager' 
    });

    const recentUsers = await User.find({ companyId })
      .select('firstName lastName email createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        adminUsers,
        managerUsers,
        memberUsers: totalUsers - adminUsers - managerUsers,
        recentUsers,
      },
    });
  } catch (error) {
    logger.error('Get company stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const uploadLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    const logoUrl = `/uploads/${req.file.filename}`;

    const company = await Company.findByIdAndUpdate(
      req.user.companyId,
      { logo: logoUrl },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Logo uploaded successfully',
      data: {
        logo: logoUrl,
      },
    });
  } catch (error) {
    logger.error('Upload logo error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = {
  getCompany,
  updateCompany,
  getCompanyStats,
  uploadLogo,
};