const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    maxLength: [100, 'Company name cannot exceed 100 characters']
  },
  domain: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/, 'Please enter a valid domain']
  },
  logo: {
    type: String,
    default: null
  },
  settings: {
    allowInvitations: {
      type: Boolean,
      default: true
    },
    requireApproval: {
      type: Boolean,
      default: false
    },
    maxUsers: {
      type: Number,
      default: 100
    }
  },
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'pro', 'enterprise'],
      default: 'free'
    },
    status: {
      type: String,
      enum: ['active', 'cancelled', 'expired'],
      default: 'active'
    },
    expiresAt: {
      type: Date,
      default: null
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

companySchema.virtual('userCount', {
  ref: 'User',
  localField: '_id',
  foreignField: 'companyId',
  count: true
});

companySchema.virtual('feedbackCount', {
  ref: 'Feedback',
  localField: '_id',
  foreignField: 'companyId',
  count: true
});

companySchema.pre('save', function(next) {
  if (this.isModified('subscription.plan') && this.subscription.plan !== 'free') {
    this.subscription.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  }
  next();
});

module.exports = mongoose.model('Company', companySchema);