import mongoose from 'mongoose';

const featureSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    pr: String,
    tags: [String],
    commits: Number,
    author: String,
  },
  { _id: false }
);

const evidenceSchema = new mongoose.Schema(
  {
    text: String,
    artifact: String,
    verifiedBy: String,
  },
  { _id: false }
);

const releasePackageSchema = new mongoose.Schema(
  {
    releaseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Release' },
    version: { type: String, required: true },
    name: String,
    branch: String,
    targetDate: String,
    features: [featureSchema],
    bugFixes: [
      {
        title: String,
        description: String,
        bugId: String,
        commit: String,
      },
    ],
    behaviourChanges: [String],
    qaSummary: {
      testsExecuted: Number,
      testsPassed: Number,
      testsFailed: Number,
      environment: String,
      browsers: String,
      evidence: [evidenceSchema],
    },
    knownLimitations: [String],
    migrationNotes: [String],
    affectedGroups: [String],
    completeness: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model('ReleasePackage', releasePackageSchema);
