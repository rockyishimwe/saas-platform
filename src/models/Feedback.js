const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  text: {
    type: String,
    required: [true, 'Comment text is required'],
    trim: true,
    maxLength: [1000, 'Comment cannot exceed 1000 characters']
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const feedbackSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxLength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxLength: [2000, 'Description cannot exceed 2000 characters']
  },
  category: {
    type: String,
    enum: ['bug', 'feature', 'improvement', 'other'],
    required: [true, 'Category is required']
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'closed'],
    default: 'open'
  },
  tags: [{
    type: String,
    trim: true,
    maxLength: [50, 'Tag cannot exceed 50 characters']
  }],
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  comments: [commentSchema],
  attachments: [{
    filename: String,
    originalName: String,
    path: String,
    size: Number,
    mimeType: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  resolvedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

feedbackSchema.index({ companyId: 1, status: 1 });
feedbackSchema.index({ companyId: 1, category: 1 });
feedbackSchema.index({ companyId: 1, priority: 1 });
feedbackSchema.index({ createdBy: 1 });
feedbackSchema.index({ assignedTo: 1 });
feedbackSchema.index({ createdAt: -1 });

feedbackSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'resolved' && !this.resolvedAt) {
    this.resolvedAt = new Date();
  }
  
  if (this.isModified('status') && this.status !== 'resolved') {
    this.resolvedAt = null;
  }
  
  next();
});

feedbackSchema.methods.addComment = function(text, userId) {
  this.comments.push({
    text,
    user: userId,
    createdAt: new Date()
  });
  return this.save();
};

feedbackSchema.methods.assignTo = function(userId) {
  this.assignedTo = userId;
  if (this.status === 'open') {
    this.status = 'in_progress';
  }
  return this.save();
};

feedbackSchema.statics.getByCompany = function(companyId, options = {}) {
  const { page = 1, limit = 10, status, category, priority, search } = options;
  const skip = (page - 1) * limit;
  
  const filter = { companyId };
  
  if (status) filter.status = status;
  if (category) filter.category = category;
  if (priority) filter.priority = priority;
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  return this.find(filter)
    .populate('createdBy', 'firstName lastName email')
    .populate('assignedTo', 'firstName lastName email')
    .populate('comments.user', 'firstName lastName email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

module.exports = mongoose.model('Feedback', feedbackSchema);