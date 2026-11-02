import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/Navigation.jsx';
import { Icon } from '../components/Icons.jsx';
import { api } from '../services/api.js';
import { CREATIVE_CATEGORIES } from '../data/talentFeed.js';

export function Passport({ onNavigate }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState(null);

  const [passportData, setPassportData] = useState(null);
  const [interests, setInterests] = useState([]);
  const [bio, setBio] = useState('');
  const [semesterGoal, setSemesterGoal] = useState('');
  const [availability, setAvailability] = useState('Flexible');
  const [preferredRoles, setPreferredRoles] = useState([]);

  useEffect(() => {
    loadPassport();
  }, []);

  const loadPassport = async () => {
    setLoading(true);
    try {
      const data = await api.getPassport();
      setPassportData(data);
      setInterests(data.interests || []);
      setBio(data.profile?.bio || '');
      setSemesterGoal(data.profile?.semester_goal || '');
      setAvailability(data.profile?.availability || 'Flexible');
      try {
        const roles = JSON.parse(data.profile?.preferred_roles || '[]');
        setPreferredRoles(roles);
      } catch {
        setPreferredRoles([]);
      }
    } catch (err) {
      setError(err.message || 'Failed to load Creative Passport');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleInterest = (catId) => {
    const existingIndex = interests.findIndex((i) => i.category === catId);
    if (existingIndex !== -1) {
      setInterests(interests.filter((i) => i.category !== catId));
    } else {
      setInterests([
        ...interests,
        {
          category: catId,
          skill_level: 'beginner',
          confidence_level: 'building',
          notes: ''
        }
      ]);
    }
  };

  const handleUpdateInterestField = (catId, field, value) => {
    setInterests(
      interests.map((i) => {
        if (i.category === catId) {
          return { ...i, [field]: value };
        }
        return i;
      })
    );
  };

  const handleToggleRole = (role) => {
    if (preferredRoles.includes(role)) {
      setPreferredRoles(preferredRoles.filter((r) => r !== role));
    } else {
      setPreferredRoles([...preferredRoles, role]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await api.savePassport({
        interests,
        bio,
        semester_goal: semesterGoal,
        availability,
        preferred_roles: preferredRoles
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
      loadPassport();
    } catch (err) {
      setError(err.message || 'Failed to save passport');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-state">
        <Icon name="refresh" size={24} className="spin" />
        <p>Loading your Creative Passport...</p>
      </div>
    );
  }

  const completionPct = passportData?.completionPercentage || 40;

  return (
    <div className="passport-page">
      <PageHeader
        eyebrow="SVM Creative Passport"
        title={
          <>
            Your creative identity. <em>In evolution.</em>
          </>
        }
        copy="Your portable record of creative disciplines, growth goals, AI evaluation milestones, and collaborative presence at SVM."
        action={
          <button
            className="button button-primary"
            onClick={handleSave}
            disabled={saving}
          >
            <Icon name={saveSuccess ? 'check' : 'spark'} size={16} />
            {saving ? 'Saving...' : saveSuccess ? 'Saved to Database' : 'Save Passport'}
          </button>
        }
      />

      {error && (
        <div className="alert-banner alert-error">
          <Icon name="alert" size={18} />
          <p>{error}</p>
        </div>
      )}

      {/* Passport Identity Header Card */}
      <section className="app-panel passport-identity-card">
        <div className="passport-id-left">
          <div className="passport-avatar-badge">
            {passportData?.profile?.name?.slice(0, 2).toUpperCase() || 'CP'}
          </div>
          <div>
            <p className="eyebrow">SVM CREATIVE PASSPORT</p>
            <h2>{passportData?.profile?.name || 'Aarav Sharma'}</h2>
            <p className="passport-dept-text">
              {passportData?.profile?.department} · {passportData?.profile?.year_of_study}
            </p>
          </div>
        </div>

        <div className="passport-completion-box">
          <div className="completion-top">
            <span>Passport Completeness</span>
            <strong className="completion-number">{completionPct}%</strong>
          </div>
          <div className="progress-track">
            <span style={{ width: `${completionPct}%` }} />
          </div>
          <p className="completion-hint">
            {completionPct >= 80
              ? 'Complete profile — high visibility for campus auditions and team formations.'
              : 'Add interests and submit work to reach 100% completion.'}
          </p>
        </div>
      </section>

      {/* Main Layout: 2 Columns */}
      <div className="passport-layout">
        {/* Left Column: Interests & Skills */}
        <section className="app-panel form-panel">
          <div className="section-title-row">
            <div>
              <p className="eyebrow">01 / Creative Disciplines</p>
              <h2>Interests & Experience</h2>
            </div>
            <span className="selection-count">{interests.length} selected</span>
          </div>

          <p className="helper-note inline">
            Select the disciplines you currently practice or are curious to explore:
          </p>

          <div className="passport-chip-cloud">
            {CREATIVE_CATEGORIES.map((cat) => {
              const isSelected = interests.some((i) => i.category === cat.id);
              return (
                <button
                  key={cat.id}
                  type="button"
                  className={isSelected ? 'passport-chip selected' : 'passport-chip'}
                  onClick={() => handleToggleInterest(cat.id)}
                  aria-pressed={isSelected}
                >
                  {isSelected && <Icon name="check" size={13} />}
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Configured Details per Selected Interest */}
          {interests.length > 0 && (
            <div className="selected-interests-settings">
              <h3 className="sub-heading-text">Discipline Details & Goals</h3>
              {interests.map((item) => {
                const catDef = CREATIVE_CATEGORIES.find((c) => c.id === item.category);
                return (
                  <div className="interest-detail-card" key={item.category}>
                    <div className="interest-detail-header">
                      <strong>{catDef?.label || item.category}</strong>
                      <button
                        type="button"
                        className="text-link-sm"
                        onClick={() => handleToggleInterest(item.category)}
                      >
                        Remove
                      </button>
                    </div>

                    <div className="interest-detail-controls">
                      <div>
                        <label>Skill Level</label>
                        <select
                          value={item.skill_level}
                          onChange={(e) =>
                            handleUpdateInterestField(item.category, 'skill_level', e.target.value)
                          }
                        >
                          <option value="beginner">Beginner</option>
                          <option value="intermediate">Intermediate</option>
                          <option value="advanced">Advanced</option>
                        </select>
                      </div>

                      <div>
                        <label>Confidence Level</label>
                        <select
                          value={item.confidence_level}
                          onChange={(e) =>
                            handleUpdateInterestField(item.category, 'confidence_level', e.target.value)
                          }
                        >
                          <option value="exploring">Just exploring</option>
                          <option value="building">Building confidence</option>
                          <option value="collaborating">Ready to collaborate</option>
                          <option value="performing">Stage-ready</option>
                        </select>
                      </div>
                    </div>

                    <input
                      type="text"
                      className="interest-note-input"
                      placeholder="Specific niche or focus (e.g. portraiture, acoustics, screenwriting)"
                      value={item.notes || ''}
                      onChange={(e) =>
                        handleUpdateInterestField(item.category, 'notes', e.target.value)
                      }
                    />
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Right Column: Introduction & Participation Preferences */}
        <section className="app-panel form-panel">
          <div className="section-title-row">
            <div>
              <p className="eyebrow">02 / Creative Profile</p>
              <h2>Introduction & Preferences</h2>
            </div>
          </div>

          <label htmlFor="p-bio">Creative Bio / Statement</label>
          <textarea
            id="p-bio"
            rows={4}
            placeholder="Tell collaborators who you are, what sounds or images inspire you, and what you enjoy making..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />

          <label htmlFor="p-goal">Goal for this Semester</label>
          <input
            id="p-goal"
            type="text"
            placeholder="e.g. Record an acoustic EP, enter campus photo fest, act in one-act play"
            value={semesterGoal}
            onChange={(e) => setSemesterGoal(e.target.value)}
          />

          <label htmlFor="p-avail">General Availability</label>
          <select
            id="p-avail"
            value={availability}
            onChange={(e) => setAvailability(e.target.value)}
          >
            <option value="Flexible">Flexible / On demand</option>
            <option value="Weekday evenings">Weekday evenings (after 5 PM)</option>
            <option value="Weekend mornings">Weekend mornings</option>
            <option value="Weekends only">Weekends only</option>
            <option value="Festival sprint">Festival sprint season</option>
          </select>

          <label>Preferred Participation Roles</label>
          <div className="roles-checkbox-grid">
            {[
              ['solo_creator', 'Solo Creator'],
              ['ensemble', 'Ensemble / Band member'],
              ['collaborator', 'Co-creator / Partner'],
              ['behind_scenes', 'Behind-the-scenes / Tech'],
              ['mentor', 'Peer mentor / Workshop lead']
            ].map(([val, label]) => (
              <label key={val} className="checkbox-pill">
                <input
                  type="checkbox"
                  checked={preferredRoles.includes(val)}
                  onChange={() => handleToggleRole(val)}
                />
                <span>{label}</span>
              </label>
            ))}
          </div>

          <div className="passport-actions-bottom">
            <button
              className="button button-primary full-width"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : saveSuccess ? 'Saved to Database' : 'Save Creative Passport'}
            </button>
          </div>
        </section>
      </div>

      {/* Creative Growth History Section */}
      <section className="app-panel passport-history-section">
        <div className="section-title-row">
          <div>
            <p className="eyebrow">Milestones & Insights</p>
            <h2>Creative Growth History</h2>
          </div>
          <button
            className="text-link"
            onClick={() => onNavigate('talent-feed')}
          >
            Share a new talent <Icon name="arrow" size={15} />
          </button>
        </div>

        {passportData?.evaluations?.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <Icon name="spark" size={22} />
            </div>
            <p>No creative milestones recorded yet</p>
            <span>Share a piece in the Talent Feed to begin building your creative history.</span>
          </div>
        ) : (
          <div className="eval-history-grid">
            {passportData?.evaluations?.map((ev) => (
              <div className="eval-history-card" key={ev.id}>
                <div className="eval-card-top">
                  <span className="eval-cat-badge">{ev.category}</span>
                  <span className="eval-date">{ev.created_at?.slice(0, 10)}</span>
                </div>
                {ev.overall_score && (
                  <div className="eval-card-score">
                    <strong>{ev.overall_score.toFixed(1)}</strong> / 10
                  </div>
                )}
                <p className="eval-summary-snippet">{ev.summary}</p>
                {ev.strengths?.length > 0 && (
                  <div className="eval-mini-strength">
                    <Icon name="checkCircle" size={14} />
                    <span>{ev.strengths[0]}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Linked Portfolio Works */}
      <section className="app-panel passport-portfolio-preview">
        <div className="section-title-row">
          <div>
            <p className="eyebrow">Cataloged Works</p>
            <h2>Uploaded Portfolio Works ({passportData?.submissions?.length || 0})</h2>
          </div>
          <button
            className="text-link"
            onClick={() => onNavigate('portfolio')}
          >
            View full portfolio <Icon name="arrow" size={15} />
          </button>
        </div>

        {passportData?.submissions?.length === 0 ? (
          <div className="empty-state">
            <p>No creative works uploaded yet</p>
            <span>Upload music, photography, writing, or performance recordings to showcase your journey.</span>
          </div>
        ) : (
          <div className="passport-sub-grid">
            {passportData?.submissions?.map((sub) => (
              <div className="passport-sub-item" key={sub.id}>
                <div className="sub-item-icon">
                  <Icon name="file" size={20} />
                </div>
                <div className="sub-item-info">
                  <strong>{sub.title}</strong>
                  <span>{sub.category} · {sub.visibility}</span>
                </div>
                <span className="sub-status-pill">{sub.status}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
