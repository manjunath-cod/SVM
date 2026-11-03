import React, { useState } from 'react';
import { AdminLogo, Icon } from '../components/Icons.jsx';
import { signInAdmin, formatAuthError } from '../services/auth.js';

export function AdminLogin({ onAdminSignedIn }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const update = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await signInAdmin(form.email, form.password);
      onAdminSignedIn?.(result.profile || result.user);
      window.location.hash = 'admin';
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleDemoAdminLogin = async () => {
    setLoading(true);
    try {
      const result = await signInAdmin('admin@svmit.ac.in', 'svm-admin-password');
      onAdminSignedIn?.(result.profile || result.user);
      window.location.hash = 'admin';
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page admin-login-page">
      <div className="auth-card admin-auth-card">
        <AdminLogo href="#landing" />
        <p className="eyebrow">SVM Faculty & Staff Portal</p>
        <h1>
          Administrator <em>Access.</em>
        </h1>
        <p className="auth-copy">
          Authorized portal for SVM cultural coordinators, faculty leads, and department heads to review student registrations and publish campus notices.
        </p>

        <div className="admin-security-pill">
          <Icon name="shield" size={14} />
          <span>Strict Role-Based Authorization Required</span>
        </div>

        {error && (
          <div className="auth-error-box admin-error" role="alert">
            <Icon name="alert" size={16} />
            <div className="auth-error-content">
              <strong>Access Restriction</strong>
              <p>{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form-stacked">
          <div className="form-group">
            <label htmlFor="admin-email">Administrator Email</label>
            <input
              id="admin-email"
              type="email"
              placeholder="coordinator@svmit.ac.in"
              value={form.email}
              onChange={update('email')}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="admin-password">Password</label>
            <input
              id="admin-password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={update('password')}
              required
            />
          </div>

          <button className="button button-dark full-width admin-submit-btn" type="submit" disabled={loading}>
            {loading ? 'Verifying admin authorization...' : 'Sign In as Administrator'}{' '}
            <Icon name="lock" size={16} />
          </button>
        </form>

        <div className="demo-personas-section">
          <span className="demo-label">Demonstration Access:</span>
          <button
            type="button"
            className="button button-light full-width demo-admin-btn"
            onClick={handleDemoAdminLogin}
            disabled={loading}
          >
            <Icon name="shield" size={15} /> Sign In as Demo Faculty Coordinator (admin@svmit.ac.in)
          </button>
        </div>

        {/* Provisioning Guide */}
        <div className="provisioning-accordion">
          <button
            type="button"
            className="accordion-toggle"
            onClick={() => setShowGuide(!showGuide)}
          >
            <Icon name="info" size={14} />
            <span>How to provision the first Firebase Administrator</span>
            <Icon name={showGuide ? 'close' : 'arrow'} size={12} />
          </button>

          {showGuide && (
            <div className="provisioning-guide-body">
              <ol>
                <li>
                  Go to <strong>Firebase Console</strong> &gt; <strong>Build</strong> &gt; <strong>Firestore Database</strong>.
                </li>
                <li>
                  Open the <strong><code>users</code></strong> collection.
                </li>
                <li>
                  Select the document for your administrator's user ID (or create one matching your admin UID).
                </li>
                <li>
                  Add/update the field <code>role</code> with string value <code>"admin"</code>.
                </li>
                <li>
                  Ensure <code>approvalStatus</code> is set to <code>"approved"</code>.
                </li>
              </ol>
              <p className="note">
                Security rules strictly prohibit clients from granting themselves admin privileges; only direct console edits or admin-authorized operations can promote an account.
              </p>
            </div>
          )}
        </div>

        <div className="auth-footer-links">
          <span>Student looking to sign in?</span>
          <a href="#signin" className="text-link">
            Return to Student Portal <Icon name="arrow" size={14} />
          </a>
        </div>
      </div>

      <div className="auth-art admin-art">
        <span>
          SVM
          <br />
          <strong>FACULTY</strong>
          <br />
          COUNCIL
        </span>
        <div className="auth-art-card">
          Inspire and mentor
          <br />
          <em>creative talent.</em>
        </div>
      </div>
    </div>
  );
}

