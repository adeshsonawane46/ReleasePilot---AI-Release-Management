import mongoose from 'mongoose';

const citationSchema = new mongoose.Schema(
  {
    id: String,
    title: String,
    body: String,
    source: String,
    confidence: String,
    git: String,
    artifact: String,
  },
  { _id: false }
);

const briefSchema = new mongoose.Schema(
  {
    releaseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Release' },
    version: { type: String, required: true },
    name: String,
    audience: { type: String, enum: ['internal', 'stakeholder'], default: 'internal' },
    docId: String,
    status: {
      type: String,
      enum: ['Draft', 'In Review', 'Approved', 'Finalized'],
      default: 'Draft',
    },
    overview: String,
    sections: [
      {
        number: Number,
        title: String,
        content: String,
        citations: [citationSchema],
      },
    ],
    citations: [citationSchema],
    qaMatrix: {
      passRate: Number,
      passed: Number,
      total: Number,
      browsers: [{ name: String, passed: Boolean, assertions: String }],
    },
    signedBy: String,
    signedAt: Date,
    sealHash: String,
  },
  { timestamps: true }
);

export default mongoose.model('Brief', briefSchema);
