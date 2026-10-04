import express from 'express';
import Release from '../models/Release.js';
import ReleasePackage from '../models/ReleasePackage.js';
import AuditLog from '../models/AuditLog.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const releases = await Release.find().sort({ updatedAt: -1 });
    res.json(releases);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const release = await Release.findById(req.params.id);
    if (!release) return res.status(404).json({ error: 'Release not found' });
    const pkg = await ReleasePackage.findOne({ releaseId: release._id });
    res.json({ release, package: pkg });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const release = new Release(req.body);
    await release.save();

    if (req.body.packageData) {
      const pkg = new ReleasePackage({
        releaseId: release._id,
        version: release.version,
        name: release.name,
        branch: release.branch,
        ...req.body.packageData,
      });
      await pkg.save();
    }

    await AuditLog.create({
      actor: req.body.author || 'System',
      actorType: 'Human',
      action: 'Release Created',
      release: release.version,
      details: `Initial release package created for ${release.version}`,
      attestation: `hash:${Math.random().toString(16).slice(2, 10)}`,
    });

    res.status(201).json(release);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const release = await Release.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!release) return res.status(404).json({ error: 'Release not found' });
    res.json(release);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const release = await Release.findByIdAndDelete(req.params.id);
    if (!release) return res.status(404).json({ error: 'Release not found' });
    await ReleasePackage.deleteMany({ releaseId: release._id });
    res.json({ message: 'Release deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
