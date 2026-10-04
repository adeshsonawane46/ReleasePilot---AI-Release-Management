import express from 'express';
import AuditLog from '../models/AuditLog.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { release, action, actor, limit = 50 } = req.query;
    const filter = {};
    if (release) filter.release = release;
    if (action) filter.action = action;
    if (actor) filter.actor = actor;
    const logs = await AuditLog.find(filter).sort({ timestamp: -1 }).limit(Number(limit));
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const log = new AuditLog(req.body);
    await log.save();
    res.status(201).json(log);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
