const mongoose = require('mongoose');

const invitationSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'manager', 'member'],
    default: 'member'
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'cancelled', 'expired'],
    default: 'pending'
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  },
  acceptedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

invitationSchema.index({ token: 1 });
invitationSchema.index({ email: 1, companyId: 1 });
invitationSchema.index({ status: 1, expiresAt: 1 });

invitationSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'accepted') {
    this.acceptedAt = new Date();
  }
  next();
});

invitationSchema.methods.isExpired = function() {
  return new Date() > this.expiresAt;
};

invitationSchema.statics.findValidInvitation = function(token) {
  return this.findOne({
    token,
    status: 'pending',
    expiresAt: { $gt: new Date() }
  }).populate('companyId').populate('invitedBy', 'firstName lastName email');
};

module.exports = mongoose.model('Invitation', invitationSchema);