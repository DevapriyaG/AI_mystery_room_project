import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createMystery } from '../api.js';

const MAX_LENGTH = 500;
const EXAMPLES = [
  'A necklace vanishes at a wedding',
  'Exam papers leaked from the staff room',
  'The office laptop was stolen during a power cut',
];

export default function Home() {
  const navigate = useNavigate();
  const [scenario, setScenario] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = 'AI Mystery Room';
  }, []);

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
    <main className="page home">
      <header className="home-header">
        <p className="eyebrow">Case file #{new Date().getFullYear()}</p>
        <h1>AI Mystery Room</h1>
        <p className="pitch">Describe a crime. Get a case file full of evidence. Find the culprit.</p>
      </header>

      <form className="panel scenario-form" onSubmit={handleSubmit}>
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
          {loading ? 'Generating…' : 'Generate mystery'}
        </button>

        {loading && (
          <p className="status" role="status">
            <span className="spinner" aria-hidden="true" /> Building your mystery…
          </p>
        )}
        {error && <p className="error" role="alert">{error}</p>}
      </form>
    </main>
  );
}
