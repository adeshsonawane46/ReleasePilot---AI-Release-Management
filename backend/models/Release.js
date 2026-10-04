import mongoose from 'mongoose';

const releaseSchema = new mongoose.Schema(
  {
    version: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    branch: { type: String, required: true },
    commit: { type: String, default: '' },
    status: {
      type: String,
      enum: ['Draft', 'Analyzing', 'Needs Review', 'Approved', 'Rejected'],
      default: 'Draft',
    },
    impact: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'MEDIUM' },
    environment: { type: String, enum: ['Production', 'Staging', 'Internal QA'], default: 'Staging' },
    author: { type: String, default: '' },
    issuesCount: { type: Number, default: 0 },
    readinessScore: { type: Number, default: 0 },
    targetDate: { type: String, default: '' },
    isSnapshot: { type: Boolean, default: false },
    snapshotDate: { type: Date },
    revisions: [
      {
        revision: Number,
        note: String,
        actor: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model('Release', releaseSchema);
