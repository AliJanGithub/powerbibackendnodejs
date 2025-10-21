import mongoose from 'mongoose';

const CommentSchema = new mongoose.Schema({
  dashboard: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Dashboard',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null
  },
  edited: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

CommentSchema.index({ dashboard: 1, createdAt: -1 });
CommentSchema.index({ user: 1 });
CommentSchema.index({ parent: 1 });

export const Comment = mongoose.model('Comment', CommentSchema);
