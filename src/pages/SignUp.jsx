import React, { useState, useEffect } from 'react';
import { Logo, Icon } from '../components/Icons.jsx';
import { registerStudent, formatAuthError } from '../services/auth.js';
import { testFirebaseConnection } from '../services/firebase.js';

const DEPARTMENTS = [
  'Computer Science & Engineering',
  'Electronics & Communication Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Electrical & Electronics Engineering',
  'Biotechnology',
  'Architecture',
  'Humanities & Social Sciences'
];

const ACADEMIC_YEARS = [
  '1st Year',
  '2nd Year',
  '3rd Year',
  '4th Year',
  'Post-Graduate / M.Tech / PhD'
];

const CREATIVE_DISCIPLINES = [
  'Singing & Vocals',
  'Music Production & Instruments',
  'Classical & Folk Dance',
  'Photography & Visual Arts',
  'Videography & Film',
  'Fine Arts & Painting',
  'Creative Writing & Poetry',
  'Theatre & Acting',
  'Graphic Design & Branding',
  'Event Management & Anchoring'
];

export function SignUp({ onRegistered }) {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    department: 'Computer Science & Engineering',
    academicYear: '3rd Year',
    creativeInterests: ['Singing & Vocals']
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [connStatus, setConnStatus] = useState(null);

  useEffect(() => {
    testFirebaseConnection().then(setConnStatus).catch(() => {});
  }, []);

  const update = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (error) setError('');
  };

  const toggleInterest = (discipline) => {
    setForm((prev) => {
      const current = prev.creativeInterests || [];
      const exists = current.includes(discipline);
      const updated = exists ? current.filter((d) => d !== discipline) : [...current, discipline];
      return { ...prev, creativeInterests: updated };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }

    if (!form.email.trim()) {
      setError('Please enter your college email.');
      return;
    }

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    if (form.creativeInterests.length === 0) {
      setError('Please select at least one creative interest.');
      return;
    }

    setLoading(true);
    try {
      const result = await registerStudent({
        email: form.email,
        password: form.password,
        fullName: form.fullName,
        department: form.department,
        academicYear: form.academicYear,
        creativeInterests: form.creativeInterests
      });

      onRegistered?.(result.user, result.profile);
      window.location.hash = 'pending-approval';
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card signup-card">
        <Logo href="#landing" />
        <p className="eyebrow">SVM Student Registration</p>
        <h1>
          Join the <em>cultural community.</em>
        </h1>
        <p className="auth-copy">
          Create your verified student account to discover campus opportunities, share your creative work, and collaborate across disciplines.
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
              <strong>Registration Notice</strong>
              <p>{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form-stacked">
          <div className="form-group">
            <label htmlFor="reg-name">Full Name</label>
            <input
              id="reg-name"
              type="text"
              placeholder="e.g. Ananya Sharma"
              value={form.fullName}
              onChange={update('fullName')}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="reg-email">College Email Address</label>
            <input
              id="reg-email"
              type="email"
              placeholder="you@svmit.ac.in"
              value={form.email}
              onChange={update('email')}
              required
            />
          </div>

          <div className="form-grid-2col">
            <div className="form-group">
              <label htmlFor="reg-dept">Department</label>
              <select id="reg-dept" value={form.department} onChange={update('department')}>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="reg-year">Academic Year</label>
              <select id="reg-year" value={form.academicYear} onChange={update('academicYear')}>
                {ACADEMIC_YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Creative Interests & Talents (Select all that apply)</label>
            <div className="chips-selector-grid">
              {CREATIVE_DISCIPLINES.map((discipline) => {
                const selected = form.creativeInterests.includes(discipline);
                return (
                  <button
                    key={discipline}
                    type="button"
                    className={`interest-chip-btn ${selected ? 'is-selected' : ''}`}
                    onClick={() => toggleInterest(discipline)}
                  >
                    <Icon name={selected ? 'check' : 'plus'} size={13} />
                    <span>{discipline}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="form-grid-2col">
            <div className="form-group">
              <label htmlFor="reg-password">Password</label>
              <input
                id="reg-password"
                type="password"
                placeholder="At least 6 characters"
                minLength={6}
                value={form.password}
                onChange={update('password')}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="reg-confirm">Confirm Password</label>
              <input
                id="reg-confirm"
                type="password"
                placeholder="Re-enter password"
                minLength={6}
                value={form.confirmPassword}
                onChange={update('confirmPassword')}
                required
              />
            </div>
          </div>

          <div className="auth-verification-notice">
            <Icon name="info" size={14} />
            <span>
              All student accounts require SVM faculty coordinator approval before full community access is granted.
            </span>
          </div>

          <button className="button button-dark full-width" type="submit" disabled={loading}>
            {loading ? 'Creating student profile...' : 'Complete Student Registration'}{' '}
            <Icon name="arrow" size={16} />
          </button>
        </form>

        <div className="auth-footer-links">
          <span>Already registered?</span>
          <a href="#signin" className="text-link">
            Sign in to your account <Icon name="arrow" size={14} />
          </a>
        </div>

        <div className="admin-portal-link-row">
          <a href="#admin/login" className="admin-portal-hint">
            <Icon name="shield" size={13} /> SVM Staff & Faculty Admin Portal
          </a>
        </div>
      </div>

      <div className="auth-art">
        <span>
          SANGEETA
          <br />
          <strong>VRINDA</strong>
          <br />
          MADHYAM
        </span>
        <div className="auth-art-card">
          Discover your
          <br />
          <em>creative stage.</em>
        </div>
      </div>
    </div>
  );
}

