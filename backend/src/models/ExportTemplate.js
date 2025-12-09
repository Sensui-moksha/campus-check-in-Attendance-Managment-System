const mongoose = require('mongoose');

const ExportTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    scope: {
      type: String,
      enum: ['course', 'department', 'college'],
      required: true,
    },
    columns: [
      {
        type: String,
        required: true,
      },
    ],
    filters: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    createdBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

// Index for efficient querying
ExportTemplateSchema.index({ scope: 1, createdBy: 1 });
ExportTemplateSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ExportTemplate', ExportTemplateSchema);
