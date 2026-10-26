import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { accuse, getMystery, revealHint } from '../api.js';
import ChatEvidence from '../evidence/ChatEvidence.jsx';
import CctvEvidence from '../evidence/CctvEvidence.jsx';
import PhotoEvidence from '../evidence/PhotoEvidence.jsx';
import CallLogEvidence from '../evidence/CallLogEvidence.jsx';
import NoteEvidence from '../evidence/NoteEvidence.jsx';

const MAX_HINTS = 3;

const EVIDENCE_KINDS = {
  chat: { icon: '💬', label: 'Chat', Viewer: ChatEvidence },
  cctv: { icon: '📹', label: 'CCTV', Viewer: CctvEvidence },
  photo: { icon: '📷', label: 'Photo', Viewer: PhotoEvidence },
  call_log: { icon: '📞', label: 'Call log', Viewer: CallLogEvidence },
  note: { icon: '📝', label: 'Note', Viewer: NoteEvidence },
};

function EvidenceModal({ item, isKey, onClose }) {
  const closeRef = useRef(null);
  const kind = EVIDENCE_KINDS[item.type];

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.classList.add('modal-open');
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.classList.remove('modal-open');
    };
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <p className="eyebrow">
              {kind.icon} {kind.label} · {item.id}
              {isKey && <span className="key-badge">Key evidence</span>}
            </p>
            <h2 id="modal-title">{item.title}</h2>
          </div>
          <button ref={closeRef} type="button" className="icon-button" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <kind.Viewer item={item} />
      </div>
    </div>
  );
}

export default function MysteryPage() {
  const { id } = useParams();
  const [mystery, setMystery] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [openEvidenceId, setOpenEvidenceId] = useState(null);
  const [hintLoading, setHintLoading] = useState(false);
  const [hintError, setHintError] = useState('');
  const [selectedSuspect, setSelectedSuspect] = useState('');
  const [accuseLoading, setAccuseLoading] = useState(false);
  const [accuseError, setAccuseError] = useState('');
  // Stable so the modal's keyboard and focus setup doesn't rerun on every render
  const closeEvidence = useCallback(() => setOpenEvidenceId(null), []);

  useEffect(() => {
    let cancelled = false;
    setMystery(null);
    setLoadError('');
    getMystery(id)
      .then((data) => {
        if (cancelled) return;
        setMystery(data);
        document.title = `${data.title} · AI Mystery Room`;
      })
      .catch((err) => !cancelled && setLoadError(err.message));
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleHint() {
    setHintLoading(true);
    setHintError('');
    try {
      const { hints } = await revealHint(id);
      setMystery((m) => ({ ...m, hints, hintsRevealed: hints.length }));
    } catch (err) {
      setHintError(err.message);
    } finally {
      setHintLoading(false);
    }
  }

  async function handleAccuse(event) {
    event.preventDefault();
    const suspect = mystery.suspects.find((s) => s.id === selectedSuspect);
    if (!suspect || !window.confirm(`Accuse ${suspect.name}? You only get one chance.`)) return;

    setAccuseLoading(true);
    setAccuseError('');
    try {
      const result = await accuse(id, suspect.id);
      setMystery((m) => ({
        ...m,
        accusation: { suspectId: suspect.id, correct: result.correct },
        solution: {
          culpritId: result.culprit.id,
          explanation: result.explanation,
          keyEvidenceIds: result.keyEvidenceIds,
        },
      }));
    } catch (err) {
      if (err.status === 409) {
        // Someone already accused on this link; show what they found
        setMystery(await getMystery(id).catch(() => mystery));
      } else {
        setAccuseError(err.message);
      }
    } finally {
      setAccuseLoading(false);
    }
  }

  if (loadError) {
    return (
      <main className="page page-center">
        <h1>Case file not found</h1>
        <p className="error">{loadError}</p>
        <Link to="/" className="button">Start a new mystery</Link>
      </main>
    );
  }

  if (!mystery) {
    return (
      <main className="page page-center">
        <p className="status" role="status">
          <span className="spinner" aria-hidden="true" /> Opening case file…
        </p>
      </main>
    );
  }

  const { accusation, solution } = mystery;
  const solved = Boolean(accusation && solution);
  const keyIds = new Set(solved ? solution.keyEvidenceIds : []);
  const culprit = solved ? mystery.suspects.find((s) => s.id === solution.culpritId) : null;
  const accused = solved ? mystery.suspects.find((s) => s.id === accusation.suspectId) : null;
  const openItem = mystery.evidence.find((e) => e.id === openEvidenceId);

  return (
    <main className="page mystery">
      <nav className="top-nav">
        <Link to="/">← New mystery</Link>
      </nav>

      <header className="panel case-header">
        <p className="eyebrow">Case file</p>
        <h1>{mystery.title}</h1>
        <p className="story">{mystery.story}</p>
        <p className="question">{mystery.question}</p>
      </header>

      <section aria-labelledby="suspects-heading">
        <h2 id="suspects-heading" className="section-title">Suspects</h2>
        <div className="grid">
          {mystery.suspects.map((s) => (
            <article key={s.id} className={`card suspect-card${culprit?.id === s.id ? ' is-culprit' : ''}`}>
              <h3>{s.name}</h3>
              <p className="role">{s.role}</p>
              <p><strong>Alibi:</strong> {s.alibi}</p>
              <p className="muted">{s.description}</p>
              {culprit?.id === s.id && <span className="tag tag-danger">Culprit</span>}
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="evidence-heading">
        <h2 id="evidence-heading" className="section-title">Evidence</h2>
        <div className="grid">
          {mystery.evidence.map((item) => {
            const kind = EVIDENCE_KINDS[item.type];
            return (
              <button
                key={item.id}
                type="button"
                className={`card evidence-card${keyIds.has(item.id) ? ' is-key' : ''}`}
                onClick={() => setOpenEvidenceId(item.id)}
              >
                <span className="evidence-icon" aria-hidden="true">{kind.icon}</span>
                <span className="evidence-type">{kind.label}</span>
                <span className="evidence-title">{item.title}</span>
                {keyIds.has(item.id) && <span className="tag tag-key">Key evidence</span>}
              </button>
            );
          })}
        </div>
      </section>

      <section className="panel" aria-labelledby="hints-heading">
        <h2 id="hints-heading" className="section-title">Hints</h2>
        {mystery.hints.length > 0 && (
          <ol className="hint-list">
            {mystery.hints.map((hint, i) => <li key={i}>{hint}</li>)}
          </ol>
        )}
        {!solved && mystery.hintsRevealed < MAX_HINTS && (
          <button type="button" className="button" onClick={handleHint} disabled={hintLoading}>
            {hintLoading ? 'Revealing…' : `Get a hint (${mystery.hintsRevealed + 1} of ${MAX_HINTS})`}
          </button>
        )}
        {mystery.hintsRevealed >= MAX_HINTS && !solved && <p className="muted">No hints left. Trust the evidence.</p>}
        {mystery.hintsRevealed === 0 && solved && <p className="muted">Solved without hints.</p>}
        {hintError && <p className="error" role="alert">{hintError}</p>}
      </section>

      {!solved && (
        <section className="panel" aria-labelledby="accuse-heading">
          <h2 id="accuse-heading" className="section-title">Make your accusation</h2>
          <form onSubmit={handleAccuse}>
            <fieldset className="suspect-options" disabled={accuseLoading}>
              <legend className="muted">{mystery.question}</legend>
              {mystery.suspects.map((s) => (
                <label key={s.id} className={`radio-option${selectedSuspect === s.id ? ' is-selected' : ''}`}>
                  <input
                    type="radio"
                    name="suspect"
                    value={s.id}
                    checked={selectedSuspect === s.id}
                    onChange={() => setSelectedSuspect(s.id)}
                  />
                  <span>{s.name}</span>
                  <span className="muted">{s.role}</span>
                </label>
              ))}
            </fieldset>
            <button type="submit" className="button button-danger" disabled={!selectedSuspect || accuseLoading}>
              {accuseLoading ? 'Accusing…' : 'Accuse'}
            </button>
            {accuseError && <p className="error" role="alert">{accuseError}</p>}
          </form>
        </section>
      )}

      {solved && (
        <section className="panel result" aria-live="polite">
          <div className={`banner ${accusation.correct ? 'banner-success' : 'banner-fail'}`}>
            {accusation.correct ? 'Case solved!' : 'Wrong suspect'}
          </div>
          {!accusation.correct && accused && (
            <p>You accused <strong>{accused.name}</strong>.</p>
          )}
          <p>
            The culprit was <strong>{culprit?.name}</strong>
            {culprit?.role ? `, ${culprit.role}` : ''}.
          </p>
          <h3>How the evidence proves it</h3>
          <p className="explanation">{solution.explanation}</p>
          <p className="muted">
            Key evidence:{' '}
            {mystery.evidence
              .filter((e) => keyIds.has(e.id))
              .map((e) => e.title)
              .join(', ')}{' '}
            (highlighted above)
          </p>
          <Link to="/" className="button button-primary">Play another mystery</Link>
        </section>
      )}

      {openItem && (
        <EvidenceModal item={openItem} isKey={keyIds.has(openItem.id)} onClose={closeEvidence} />
      )}
    </main>
  );
}
