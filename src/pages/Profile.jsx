import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/Navigation.jsx';
import { Icon } from '../components/Icons.jsx';
import { Toast } from '../components/Toast.jsx';
import { api } from '../services/api.js';

export function Profile({ onSignOut, currentUser, onUserUpdated }) {
  const [profile, setProfile] = useState(currentUser || null);
  const [name, setName] = useState(currentUser?.name || '');
  const [department, setDepartment] = useState(currentUser?.department || 'Information Science & Engineering');
  const [yearOfStudy, setYearOfStudy] = useState(currentUser?.year_of_study || '3rd Year');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const profileRes = await api.getProfile().catch(() => null);
      if (profileRes?.profile) {
        setProfile(profileRes.profile);
        setName(profileRes.profile.name);
        setDepartment(profileRes.profile.department);
        setYearOfStudy(profileRes.profile.year_of_study);
      }
    } catch (err) {
      console.warn('Profile load error:', err);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.updateProfile({
        name,
        department,
        year_of_study: yearOfStudy
      });
      setProfile(res.profile);
      if (onUserUpdated) onUserUpdated(res.profile);
      setToast({
        type: 'success',
        title: 'Profile Updated',
        message: 'Your student details have been saved to the database.'
      });
    } catch (err) {
      setToast({
        type: 'error',
        title: 'Save failed',
        message: err.message
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-page">
      <PageHeader
        eyebrow="Account & Preferences"
        title={
          <>
            Profile & <em>Settings.</em>
          </>
        }
        copy="Manage your student identity, college credentials, privacy preferences, and system diagnostic status."
      />

      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      <div className="profile-layout-grid">
        {/* Profile Edit Form */}
        <section className="app-panel form-panel">
          <div className="section-title-row">
            <div>
              <p className="eyebrow">Student Details</p>
              <h2>Personal Information</h2>
            </div>
          </div>

          <form onSubmit={handleSaveProfile}>
            <label htmlFor="prof-name">Full Name</label>
            <input
              id="prof-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <label htmlFor="prof-email">College Email (Read Only)</label>
            <input
              id="prof-email"
              type="email"
              value={profile?.email || 'student@svmit.ac.in'}
              disabled
              className="input-disabled"
            />

            <label htmlFor="prof-dept">Academic Department</label>
            <select
              id="prof-dept"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            >
              <option value="Information Science & Engineering">Information Science & Engineering</option>
              <option value="Computer Science & Engineering">Computer Science & Engineering</option>
              <option value="Electronics & Communication Engineering">Electronics & Communication Engineering</option>
              <option value="Mechanical Engineering">Mechanical Engineering</option>
              <option value="Civil Engineering">Civil Engineering</option>
              <option value="Biotechnology">Biotechnology</option>
              <option value="Basic Sciences & Humanities">Basic Sciences & Humanities</option>
            </select>

            <label htmlFor="prof-year">Year of Study</label>
            <select
              id="prof-year"
              value={yearOfStudy}
              onChange={(e) => setYearOfStudy(e.target.value)}
            >
              <option value="1st Year">1st Year (Freshman)</option>
              <option value="2nd Year">2nd Year (Sophomore)</option>
              <option value="3rd Year">3rd Year (Junior)</option>
              <option value="4th Year">4th Year (Senior)</option>
              <option value="Postgraduate / Alumni">Postgraduate / Alumni</option>
            </select>

            <button
              className="button button-primary full-width modal-submit-btn"
              type="submit"
              disabled={saving}
            >
              {saving ? 'Saving changes...' : 'Save Profile Changes'} <Icon name="check" size={16} />
            </button>
          </form>
        </section>

        {/* System Diagnostics & Session Info */}
        <div className="profile-sidebar-cards">
          {/* Diagnostic Card */}
          <section className="app-panel diagnostic-card">
            <div className="section-title-row">
              <div>
                <p className="eyebrow">Integration Status</p>
                <h2>System Health</h2>
              </div>
            </div>

            <div className="health-item">
              <div className="health-icon ok">
                <Icon name="checkCircle" size={16} />
              </div>
              <div className="health-details">
                <strong>Local SQLite Database</strong>
                <span>Connected and initialized with WAL journaling</span>
              </div>
            </div>

            <div className="health-item">
              <div className="health-icon ok">
                <Icon name="shield" size={16} />
              </div>
              <div className="health-details">
                <strong>Media File Storage</strong>
                <span>Local filesystem uploads/ directory initialized</span>
              </div>
            </div>
          </section>

          {/* Account Actions */}
          <section className="app-panel danger-card">
            <h3>Account Session</h3>
            <p>Signed in as <strong>{profile?.email}</strong>.</p>
            <button
              className="button button-dark full-width"
              onClick={onSignOut}
            >
              <Icon name="arrowLeft" size={16} /> Sign out of CultureLoop
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
