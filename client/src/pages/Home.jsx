import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createMystery } from '../api.js';

const MAX_LENGTH = 500;
const EXAMPLES = [
  'A necklace vanishes at a wedding',
  'Exam papers leaked from the staff room',
  'The office laptop was stolen during a power cut',
];
// Generation takes 10-40 s, so cycle through these instead of one static message
const LOADING_STEPS = [
  'Securing the scene…',
  'Dusting for fingerprints…',
  'Interviewing the suspects…',
  'Pulling the CCTV footage…',
  'Checking phone records…',
  'Sealing the case file…',
];
const TAPE_TEXT = 'CRIME SCENE · DO NOT CROSS · '.repeat(8);

export default function Home() {
  const navigate = useNavigate();
  const [scenario, setScenario] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = 'Cold Case AI';
  }, []);

  useEffect(() => {
    if (!loading) return;
    setLoadingStep(0);
    // Stops on the last step rather than looping, so a slow generation doesn't look stuck in a cycle
    const timer = setInterval(() => {
      setLoadingStep((step) => Math.min(step + 1, LOADING_STEPS.length - 1));
    }, 4500);
    return () => clearInterval(timer);
  }, [loading]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!scenario.trim() || loading) return;
    setLoading(true);
    setError('');
    try {
      const { id } = await createMystery(scenario.trim());
      navigate(`/mystery/${id}`);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <>
      <div className="crime-tape" aria-hidden="true">
        <span>{TAPE_TEXT}</span>
      </div>

      <main className="page home">
        <header className="home-header">
          <p className="eyebrow">Case file #{new Date().getFullYear()}</p>
          <h1 className="brand">
            Cold Case <span className="brand-ai">AI</span>
          </h1>
          <p className="pitch">Describe a crime. Get a case file full of evidence. Find the culprit.</p>
          <ol className="steps">
            <li><span>01</span> Describe a crime</li>
            <li><span>02</span> Study the evidence</li>
            <li><span>03</span> Name the culprit</li>
          </ol>
        </header>

        <form className="panel scenario-form" onSubmit={handleSubmit}>
          <span className="stamp form-stamp" aria-hidden="true">Unsolved</span>
          <label htmlFor="scenario">What happened?</label>
          <textarea
            id="scenario"
            value={scenario}
            onChange={(e) => setScenario(e.target.value)}
            maxLength={MAX_LENGTH}
            rows={4}
            placeholder="A rare painting disappears from a museum during a gala…"
            disabled={loading}
          />
          <div className="scenario-meta">
            <div className="chips">
              {EXAMPLES.map((example) => (
                <button
                  key={example}
                  type="button"
                  className="chip"
                  onClick={() => setScenario(example)}
                  disabled={loading}
                >
                  {example}
                </button>
              ))}
            </div>
            <span className="char-count">{scenario.length}/{MAX_LENGTH}</span>
          </div>

          <button type="submit" className="button button-primary" disabled={loading || !scenario.trim()}>
            {loading ? 'Opening the case…' : 'Open the case'}
          </button>

          {loading && (
            <p className="status" role="status">
              <span className="spinner" aria-hidden="true" />
              <span key={loadingStep} className="status-step">{LOADING_STEPS[loadingStep]}</span>
            </p>
          )}
          {error && <p className="error" role="alert">{error}</p>}
        </form>
      </main>
    </>
  );
}
