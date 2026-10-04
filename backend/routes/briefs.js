import express from 'express';
import Brief from '../models/Brief.js';
import { generateBrief } from '../services/aiService.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const briefs = await Brief.find().sort({ updatedAt: -1 });
    res.json(briefs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const brief = await Brief.findById(req.params.id);
    if (!brief) return res.status(404).json({ error: 'Brief not found' });
    res.json(brief);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/generate', async (req, res) => {
  try {
    const { releaseData, audience } = req.body;
    const generated = await generateBrief(releaseData, audience);
    const brief = new Brief({
      version: releaseData.version,
      name: releaseData.name,
      audience: audience || 'internal',
      ...generated,
    });
    await brief.save();
    res.status(201).json(brief);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const brief = await Brief.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!brief) return res.status(404).json({ error: 'Brief not found' });
    res.json(brief);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
