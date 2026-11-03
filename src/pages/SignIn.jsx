import React, { useState, useEffect } from 'react';
import { Logo, Icon } from '../components/Icons.jsx';
import {
  signInStudent,
  signInWithGoogle,
  resetPassword,
  formatAuthError
} from '../services/auth.js';
import { testFirebaseConnection } from '../services/firebase.js';

const DEMO_PERSONAS = [
  { name: 'Ananya Sharma', email: 'ananya.s@svmit.ac.in', discipline: 'Vocal Music', department: 'Computer Science', year: '3rd Year' },
  { name: 'Rohan Deshmukh', email: 'rohan.d@svmit.ac.in', discipline: 'Photography', department: 'Mechanical Eng.', year: '2nd Year' },
  { name: 'Priya Nayak', email: 'priya.n@svmit.ac.in', discipline: 'Classical Dance', department: 'Electronics & Comm.', year: '4th Year' },
  { name: 'Vikram Joshi', email: 'vikram.j@svmit.ac.in', discipline: 'Theatre & Acting', department: 'Civil Eng.', year: '1st Year' }
];

export function SignIn({ onSignedIn }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [connStatus, setConnStatus] = useState(null);

  useEffect(() => {
    testFirebaseConnection().then(setConnStatus).catch(() => {});
  }, []);

  const update = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (error) setError('');
    if (notice) setNotice('');
  };

  const handleSuccessfulAuth = (result) => {
    const user = result.user || result;
    const approvalStatus = result.approvalStatus || user.approvalStatus || 'approved';

    if (approvalStatus === 'pending') {
      onSignedIn?.(user);
      window.location.hash = 'pending-approval';
      return;
    }

    if (approvalStatus === 'rejected') {
      setError('Your student registration was rejected by the administrator. Please contact the SVM coordinator.');
      return;
    }

    onSignedIn?.(user);
    window.location.hash = 'dashboard';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    setLoading(true);

    try {
      const result = await signInStudent(form.email, form.password);
      handleSuccessfulAuth(result);
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setNotice('');
    setLoading(true);
    try {
      const result = await signInWithGoogle();
      handleSuccessfulAuth(result);
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!form.email.trim()) {
      setError('Please enter your college email first to reset your password.');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(form.email);
      setNotice('Password reset email sent. Please check your inbox.');
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handlePersonaSelect = async (p) => {
    setLoading(true);
    try {
      const result = await signInStudent(p.email, 'demo-password');
      handleSuccessfulAuth(result);
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Logo href="#landing" />
        <p className="eyebrow">SVM Student Portal</p>
        <h1>
          Make room for your <em>next idea.</em>
        </h1>
        <p className="auth-copy">
          Sign in to discover campus opportunities, share your creative work for AI evaluation, and find collaborators across SVM.
        </p>

        {/* Real-time Connection Indicator */}
        {connStatus && (
          <div className={`auth-mode-indicator ${connStatus.connected ? 'cloud' : 'local'}`}>
            <Icon name={connStatus.connected ? 'checkCircle' : 'shield'} size={14} />
            <span>{connStatus.message}</span>
          </div>
        )}

        {error && (
          <div className="auth-error-box" role="alert">
            <Icon name="alert" size={16} />
            <div className="auth-error-content">
              <strong>Authentication Error</strong>
              <p>{error}</p>
              {error.includes('Identity Toolkit') && (
                <button
                  type="button"
                  className="button button-light btn-sm mt-2"
                  onClick={() => handlePersonaSelect(DEMO_PERSONAS[0])}
                >
                  Enter in Campus Demo Mode while API Key is updated
                </button>
              )}
            </div>
          </div>
        )}

        {notice && (
          <div className="auth-notice-box" role="status">
            <Icon name="checkCircle" size={15} />
            <span>{notice}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form-stacked">
          <div className="form-group">
            <label htmlFor="student-email">College Email Address</label>
            <input
              id="student-email"
              type="email"
              placeholder="you@svmit.ac.in"
              value={form.email}
              onChange={update('email')}
              required
            />
          </div>

          <div className="form-group">
            <div className="label-with-action">
              <label htmlFor="student-password">Password</label>
              <button
                type="button"
                className="text-link small-link"
                onClick={handleForgotPassword}
              >
                Forgot password?
              </button>
            </div>
            <input
              id="student-password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={update('password')}
              required
            />
          </div>

          <button className="button button-dark full-width" type="submit" disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign In to SVM Portal'} <Icon name="arrow" size={16} />
          </button>
        </form>

        <div className="auth-divider">
          <span>or continue with</span>
        </div>

        <button
          type="button"
          className="button button-light full-width google-btn"
          onClick={handleGoogleSignIn}
          disabled={loading}
        >
          <svg className="google-icon" viewBox="0 0 24 24" width="16" height="16">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        <div className="demo-personas-section">
          <span className="demo-label">Quick Demo Access · Sign In as Student Persona:</span>
          <div className="demo-personas-grid">
            {DEMO_PERSONAS.map((p) => (
              <button
                key={p.email}
                type="button"
                className="persona-chip"
                onClick={() => handlePersonaSelect(p)}
                title={`Sign in as ${p.name} (${p.discipline})`}
              >
                <strong>{p.name}</strong>
                <span>{p.discipline}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="auth-footer-links">
          <span>New student at SVM?</span>
          <a href="#signup" className="text-link">
            Create an account <Icon name="arrow" size={14} />
          </a>
        </div>

        <div className="admin-portal-link-row">
          <a href="#admin/login" className="admin-portal-hint">
            <Icon name="shield" size={13} /> SVM Staff & Administrator Portal
          </a>
        </div>
      </div>

      <div className="auth-art">
        <span>
          CREATIVE
          <br />
          <strong>ENERGY</strong>
          <br />
          SVM
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
