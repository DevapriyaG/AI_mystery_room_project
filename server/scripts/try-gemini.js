// Generate one mystery from the command line and print a summary.
// Usage: node server/scripts/try-gemini.js "A necklace vanishes at a wedding" [--json]
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { generateMystery, validateMystery } from '../gemini.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '..', '.env'), quiet: true });

const args = process.argv.slice(2);
const showJson = args.includes('--json');
const scenario = args.filter((arg) => arg !== '--json').join(' ') || 'A necklace vanishes at a wedding';

console.log(`Model: ${process.env.GEMINI_MODEL}`);
console.log(`Scenario: ${scenario}\n`);

const started = Date.now();
try {
  const mystery = await generateMystery(scenario);
  const seconds = ((Date.now() - started) / 1000).toFixed(1);
  const culprit = mystery.suspects.find((s) => s.id === mystery.solution.culpritId);

  console.log(`Generated in ${seconds}s: "${mystery.title}"`);
  console.log(`Question: ${mystery.question}`);
  console.log(`Suspects: ${mystery.suspects.map((s) => `${s.id} ${s.name} (${s.role})`).join(', ')}`);
  console.log(`Evidence: ${mystery.evidence.map((e) => `${e.id}:${e.type}`).join(', ')}`);
  console.log(`Hints: ${mystery.hints.length}`);
  console.log(`Culprit: ${culprit.name}, key evidence ${mystery.solution.keyEvidenceIds.join(', ')}`);
  console.log(`Checks: ${validateMystery(mystery).length === 0 ? 'all passed' : 'FAILED'}`);
  if (showJson) console.log('\n' + JSON.stringify(mystery, null, 2));
} catch (err) {
  console.error(`Failed after ${((Date.now() - started) / 1000).toFixed(1)}s: ${err.message}`);
  process.exit(1);
}
