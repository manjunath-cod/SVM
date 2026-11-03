import React, { useState } from 'react';
import { Icon, Logo } from '../components/Icons.jsx';
import { firebaseConfigured } from '../services/firebase.js';
import { register, resetPassword, signIn, signInWithGoogle } from '../services/auth.js';

const DEMO_PERSONAS = [
  { name: 'Ananya Sharma', email: 'ananya.s@svmit.ac.in', discipline: 'Vocal Music', department: 'Computer Science', year: '3rd Year' },
  { name: 'Rohan Deshmukh', email: 'rohan.d@svmit.ac.in', discipline: 'Photography', department: 'Mechanical Eng.', year: '2nd Year' },
  { name: 'Priya Nayak', email: 'priya.n@svmit.ac.in', discipline: 'Classical Dance', department: 'Electronics & Comm.', year: '4th Year' },
  { name: 'Vikram Joshi', email: 'vikram.j@svmit.ac.in', discipline: 'Theatre & Acting', department: 'Civil Eng.', year: '1st Year' }
];

export function SignIn({ onSignedIn }) {
  const [mode, setMode] = useState('signin');
  const [form, setForm] = useState({
    email: '',
    password: '',
    displayName: '',
    department: 'Computer Science',
    academicYear: '3rd Year'
  });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  const update = (key) => (event) => setForm((curr) => ({ ...curr, [key]: event.target.value }));

  const handleLocalSignIn = (customEmail, customName, department, year) => {
    const user = {
      id: 'student-' + Math.abs(customEmail.split('').reduce((acc, c) => acc * 31 + c.charCodeAt(0), 0) % 10000),
      uid: 'student-demo',
      name: customName || customEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      displayName: customName || customEmail.split('@')[0],
      email: customEmail,
      department: department || 'Engineering',
      year_of_study: year || '3rd Year',
      academicYear: year || '3rd Year'
    };
    onSignedIn?.(user);
  };

  const handlePersonaSelect = (p) => {
    handleLocalSignIn(p.email, p.name, p.department, p.year);
  };

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setStatus({ type: '', message: '' });

    if (firebaseConfigured) {
      try {
        let user;
        if (mode === 'register') {
          user = await register(form);
        } else {
          user = await signIn(form.email, form.password);
        }
        onSignedIn?.(user);
        return;
      } catch (error) {
        console.warn('Firebase Auth notice:', error);
        let message = error.code === 'auth/invalid-credential' ? 'Email or password is incorrect.' : error.message;
        if (
          error.code === 'auth/api-key-not-valid' ||
          error.code === 'auth/api-key-not-supported' ||
          error.code === 'auth/api-keys-are-not-supported-by-this-api' ||
          error.code === 'auth/configuration-not-found'
        ) {
          message = 'Firebase Web API key in .env needs activation in Firebase Console. You can enter in Campus Demo Mode below.';
        }
        setStatus({ type: 'error', message });
        setLoading(false);
        return;
      }
    }

    handleLocalSignIn(form.email || 'student@svmit.ac.in', form.displayName || 'SVM Student', form.department, form.academicYear);
    setLoading(false);
  };

  const handleGoogleAuth = async () => {
    if (!firebaseConfigured) {
      handleLocalSignIn('google.student@svmit.ac.in', 'Google Student User');
      return;
    }
    setLoading(true);
    try {
      const user = await signInWithGoogle();
      onSignedIn?.(user);
    } catch (err) {
      setStatus({ type: 'error', message: err.message || 'Google sign-in was not completed.' });
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
          {mode === 'register' ? (
            <>Create your <em>creative space.</em></>
          ) : (
            <>Make room for your <em>next idea.</em></>
          )}
        </h1>
        <p className="auth-copy">
          Use your SVM credentials or campus demo access to discover opportunities, share work, and find collaborators.
        </p>

        {firebaseConfigured ? (
          <div className="auth-mode-indicator cloud">
            <Icon name="checkCircle" size={14} />
            <span>Firebase Cloud Sync connected</span>
          </div>
        ) : (
          <div className="auth-mode-indicator local">
            <Icon name="shield" size={14} />
            <span>Campus Demo Mode active · Instant local evaluation & persistence</span>
          </div>
        )}

        <form onSubmit={submit}>
          {mode === 'register' && (
            <>
              <label htmlFor="display-name">Full name</label>
              <input
                id="display-name"
                value={form.displayName}
                onChange={update('displayName')}
                placeholder="Ananya Sharma"
                required
              />
              <label htmlFor="department">Department</label>
              <input
                id="department"
                value={form.department}
                onChange={update('department')}
                placeholder="Computer Science & Engineering"
              />
              <label htmlFor="academic-year">Academic year</label>
              <input
                id="academic-year"
                value={form.academicYear}
                onChange={update('academicYear')}
                placeholder="3rd Year"
              />
            </>
          )}

          <label htmlFor="student-email">College email</label>
          <input
            id="student-email"
            type="email"
            placeholder="you@svmit.ac.in"
            value={form.email}
            onChange={update('email')}
            required
          />

          <label htmlFor="student-password">
            Password {firebaseConfigured ? '' : '(Optional in demo mode)'}
          </label>
          <input
            id="student-password"
            type="password"
            placeholder="••••••••"
            minLength={firebaseConfigured ? 6 : 1}
            value={form.password}
            onChange={update('password')}
            required={firebaseConfigured && mode !== 'reset'}
          />

          <button className="button button-dark full-width" type="submit" disabled={loading}>
            {loading
              ? 'Connecting...'
              : mode === 'register'
              ? 'Create student account'
              : firebaseConfigured
              ? 'Continue to CultureLoop'
              : 'Enter CultureLoop'} <Icon name="arrow" size={16} />
          </button>
        </form>

        {status.message && (
          <div className={status.type === 'error' ? 'auth-error' : 'auth-note'} role="alert">
            {status.message}
            {status.type === 'error' && (
              <button
                type="button"
                className="button button-light btn-sm"
                style={{ marginTop: '8px', display: 'block', width: '100%' }}
                onClick={() => handleLocalSignIn(form.email || 'reviewer@svmit.ac.in', 'SVM Guest Creator')}
              >
                Enter in Campus Demo Mode instead
              </button>
            )}
          </div>
        )}

        <div className="demo-personas-section">
          <span className="demo-label">Quick Access · Continue with a Student Persona:</span>
          <div className="demo-personas-grid">
            {DEMO_PERSONAS.map((p) => (
              <button
                key={p.email}
                type="button"
                className="persona-chip"
                onClick={() => handlePersonaSelect(p)}
                title={`Enter as ${p.name} (${p.discipline})`}
              >
                <strong>{p.name}</strong>
                <span>{p.discipline}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="auth-secondary-actions">
          <button
            type="button"
            className="text-link"
            onClick={handleGoogleAuth}
            disabled={loading}
          >
            Continue with Google
          </button>
          <button
            type="button"
            className="text-link"
            onClick={() => setMode(mode === 'signin' ? 'register' : 'signin')}
          >
            {mode === 'signin' ? 'Create a student account' : 'I already have an account'}
          </button>
        </div>
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
