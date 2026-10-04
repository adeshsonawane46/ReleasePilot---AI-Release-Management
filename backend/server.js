import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

import releaseRoutes from './routes/releases.js';
import briefRoutes from './routes/briefs.js';
import analysisRoutes from './routes/analysis.js';
import auditRoutes from './routes/audit.js';
import compareRoutes from './routes/compare.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/releasepilot';

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use('/api/releases', releaseRoutes);
app.use('/api/briefs', briefRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/compare', compareRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`ReleasePilot API running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    console.log('Starting server without database (demo mode)...');
    app.listen(PORT, () => {
      console.log(`ReleasePilot API running on http://localhost:${PORT} (demo mode)`);
    });
  });
