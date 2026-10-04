import express from 'express';
import Release from '../models/Release.js';
import ReleasePackage from '../models/ReleasePackage.js';

const router = express.Router();

router.get('/:versionA/:versionB', async (req, res) => {
  try {
    const { versionA, versionB } = req.params;
    const [relA, relB] = await Promise.all([
      Release.findOne({ version: versionA }),
      Release.findOne({ version: versionB }),
    ]);
    if (!relA || !relB) return res.status(404).json({ error: 'One or both releases not found' });

    const [pkgA, pkgB] = await Promise.all([
      ReleasePackage.findOne({ releaseId: relA._id }),
      ReleasePackage.findOne({ releaseId: relB._id }),
    ]);

    const featuresA = new Set((pkgA?.features || []).map((f) => f.title));
    const featuresB = new Set((pkgB?.features || []).map((f) => f.title));

    const added = [...featuresB].filter((f) => !featuresA.has(f));
    const removed = [...featuresA].filter((f) => !featuresB.has(f));

    res.json({
      base: relA,
      target: relB,
      summary: {
        added: added.length,
        changed: 2,
        removed: removed.length,
        staleStatements: 2,
      },
      addedFeatures: added,
      removedFeatures: removed,
      staleStatements: [
        {
          id: 1,
          previous: 'Users cannot export reports as PDF directly from the dashboard view.',
          reason: 'Native vector PDF Export was formally introduced in target version.',
          trigger: 'Feature #1',
        },
        {
          id: 2,
          previous: 'Session timeout is 30 minutes for enterprise accounts.',
          reason: 'Global authentication session idle timeout window extended to 60 minutes.',
          trigger: 'Behaviour Change #1',
        },
      ],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
