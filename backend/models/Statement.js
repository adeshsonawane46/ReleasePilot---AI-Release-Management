import mongoose from 'mongoose';

const statementSchema = new mongoose.Schema(
  {
    releaseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Release' },
    version: { type: String, required: true },
    text: { type: String, required: true },
    originalText: String,
    status: {
      type: String,
      enum: ['Needs Review', 'Approved', 'Edited', 'Rejected', 'Unsupported Claim'],
      default: 'Needs Review',
    },
    severity: { type: String, enum: ['Low', 'Medium', 'High', 'Blocker'], default: 'Medium' },
    confidence: String,
    evidence: [String],
    justification: String,
    reviewedBy: String,
    reviewedAt: Date,
    stmtId: String,
  },
  { timestamps: true }
);

export default mongoose.model('Statement', statementSchema);
