import React, { useState } from 'react';
import { Logo, Icon } from '../components/Icons.jsx';

const DEMO_PERSONAS = [
  { name: 'Aarav Sharma', email: 'student@svmit.ac.in', discipline: 'Filmmaking & Guitar' },
  { name: 'Meera Sengupta', email: 'meera.s@svmit.ac.in', discipline: 'Poetry & Vocals' },
  { name: 'Rohit Kulkarni', email: 'rohit.k@svmit.ac.in', discipline: 'Contemporary Dance' }
];

export function SignIn({ onSignIn }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const targetEmail = email.trim() || 'student@svmit.ac.in';
    setLoading(true);
    setError('');
    try {
      await onSignIn(targetEmail);
    } catch (err) {
      setError(err.message || 'Unable to open your dashboard right now.');
    } finally {
      setLoading(false);
    }
  };

  const handlePickPersona = async (personaEmail) => {
    setEmail(personaEmail);
    setLoading(true);
    setError('');
    try {
      await onSignIn(personaEmail);
    } catch (err) {
      setError(err.message || 'Unable to open your dashboard right now.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Logo href="#top" />
        <p className="eyebrow">SVM Student Portal</p>
        <h1>
          Make room for your <em>next idea.</em>
        </h1>
        <p className="auth-copy">
          Sign in to discover creative opportunities, share work for AI evaluation, and find collaborators across SVM.
        </p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="student-email">College email</label>
          <input
            id="student-email"
            type="email"
            placeholder="you@svmit.ac.in"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button className="button button-dark full-width" type="submit" disabled={loading}>
            {loading ? 'Entering CultureLoop...' : 'Continue to CultureLoop'} <Icon name="arrow" size={16} />
          </button>
          {error && <p className="auth-error" role="alert">{error}</p>}
        </form>

        <div className="demo-personas-section">
          <span className="demo-label">Or continue with a student persona:</span>
          <div className="demo-personas-grid">
            {DEMO_PERSONAS.map((p) => (
              <button
                key={p.email}
                type="button"
                className="persona-chip"
                onClick={() => handlePickPersona(p.email)}
              >
                <strong>{p.name}</strong>
                <span>{p.discipline}</span>
              </button>
            ))}
          </div>
        </div>

        <p className="auth-note">
          <Icon name="shield" size={13} /> Real session backed by local SQLite persistence. No passwords required for campus demo access.
        </p>
      </div>

      <div className="auth-art">
        <span>
          CREATIVE
          <br />
          <strong>ENERGY</strong>
        </span>
        <div className="auth-art-card">
          Find your
          <br />
          <em>people.</em>
        </div>
      </div>
    </div>
  );
}
