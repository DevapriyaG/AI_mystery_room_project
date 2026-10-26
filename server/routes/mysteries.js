import express from 'express';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import Mystery from '../models/Mystery.js';
import { generateMystery } from '../gemini.js';

const MAX_HINTS = 3;
const router = express.Router();

// Protects the free Gemini quota
const createLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: "You've made 5 mysteries this hour. Try again later." },
});

// Builds the browser's view field by field, so solution and unrevealed hints can't slip through
function publicView(doc) {
  const { title, story, question, suspects, evidence, hints, solution } = doc.data;
  const view = {
    id: doc.id,
    title,
    story,
    question,
    suspects,
    evidence,
    hintsRevealed: doc.hintsRevealed,
    hints: hints.slice(0, doc.hintsRevealed),
    accusation: doc.accusation,
    createdAt: doc.createdAt,
  };
  if (doc.accusation) view.solution = solution;
  return view;
}

function notFound(res) {
  return res.status(404).json({ error: 'Mystery not found' });
}

router.post('/', createLimiter, async (req, res) => {
  const scenario = req.body?.scenario;
  const data = await generateMystery(scenario); // throws a MysteryError with a player-safe message
  const mystery = await Mystery.create({ scenario: scenario.trim(), data });
  res.status(201).json({ id: mystery.id });
});

router.get('/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return notFound(res);
  const mystery = await Mystery.findById(req.params.id);
  if (!mystery) return notFound(res);
  res.json(publicView(mystery));
});

router.post('/:id/hint', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return notFound(res);

  // Only increments while under the limit, so rapid clicks can't overshoot
  const mystery = await Mystery.findOneAndUpdate(
    { _id: req.params.id, hintsRevealed: { $lt: MAX_HINTS } },
    { $inc: { hintsRevealed: 1 } },
    { returnDocument: 'after' }
  );
  if (!mystery) {
    const exists = await Mystery.exists({ _id: req.params.id });
    if (!exists) return notFound(res);
    return res.status(400).json({ error: 'All 3 hints have already been revealed' });
  }
  res.json({ hints: mystery.data.hints.slice(0, mystery.hintsRevealed) });
});

router.post('/:id/accuse', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return notFound(res);
  const suspectId = req.body?.suspectId;

  const mystery = await Mystery.findById(req.params.id);
  if (!mystery) return notFound(res);
  if (mystery.accusation) return res.status(409).json({ error: 'This mystery has already been solved' });
  if (!mystery.data.suspects.some((s) => s.id === suspectId)) {
    return res.status(400).json({ error: 'Pick one of the suspects' });
  }

  const { solution, suspects } = mystery.data;
  const accusation = { suspectId, correct: suspectId === solution.culpritId };

  // Only saves if nobody accused in the meantime
  const updated = await Mystery.findOneAndUpdate(
    { _id: mystery._id, accusation: null },
    { $set: { accusation } },
    { returnDocument: 'after' }
  );
  if (!updated) return res.status(409).json({ error: 'This mystery has already been solved' });

  res.json({
    correct: accusation.correct,
    culprit: suspects.find((s) => s.id === solution.culpritId),
    explanation: solution.explanation,
    keyEvidenceIds: solution.keyEvidenceIds,
  });
});

export default router;
