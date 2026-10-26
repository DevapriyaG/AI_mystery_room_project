import mongoose from 'mongoose';

const accusationSchema = new mongoose.Schema(
  {
    suspectId: { type: String, required: true },
    correct: { type: Boolean, required: true },
  },
  { _id: false }
);

const mysterySchema = new mongoose.Schema(
  {
    scenario: { type: String, required: true },
    data: { type: mongoose.Schema.Types.Mixed, required: true }, // the full Gemini JSON, solution included
    hintsRevealed: { type: Number, default: 0 },
    accusation: { type: accusationSchema, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.model('Mystery', mysterySchema);
