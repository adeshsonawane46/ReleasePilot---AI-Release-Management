import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    actor: { type: String, required: true },
    actorType: { type: String, enum: ['Human', 'AI Agent', 'CI/CD'], default: 'Human' },
    actorRole: String,
    action: {
      type: String,
      enum: ['Release Created', 'AI Analysis', 'AI Generated', 'Edited', 'Approved', 'Rejected', 'Finalized'],
      required: true,
    },
    release: String,
    details: String,
    attestation: String,
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model('AuditLog', auditLogSchema);
