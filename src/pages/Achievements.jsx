import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/Navigation.jsx';
import { Icon } from '../components/Icons.jsx';
import { Modal } from '../components/Modal.jsx';
import { Toast } from '../components/Toast.jsx';
import { api } from '../services/api.js';
import { SVM_BADGES, BADGE_FILTER_TABS } from '../data/badges.js';

export function Achievements({ onNavigate, currentUser }) {
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [achievementsData, setAchievementsData] = useState(null);
  const [filter, setFilter] = useState('all');
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [celebrationBadge, setCelebrationBadge] = useState(null);
  const [toast, setToast] = useState(null);
  const [showLeagueInfo, setShowLeagueInfo] = useState(false);

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    setLoading(true);
    try {
      const data = await api.getAchievements();
      setAchievementsData(data);

      // Check if there are newly unlocked badges awaiting celebration
      if (data.recentUnlocks && data.recentUnlocks.length > 0) {
        setCelebrationBadge(data.recentUnlocks[0]);
      }
    } catch (err) {
      console.warn('Failed to load achievements:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyNow = async () => {
    setVerifying(true);
    try {
      const res = await api.verifyAchievements();
      setAchievementsData(res);
      setToast({
        type: 'success',
        title: 'Milestones Verified',
        message: 'Your creative activities and milestone credentials are up to date!'
      });
      if (res.recentUnlocks && res.recentUnlocks.length > 0) {
        setCelebrationBadge(res.recentUnlocks[0]);
      }
    } catch (err) {
      setToast({
        type: 'error',
        title: 'Verification Error',
        message: err.message || 'Unable to verify milestones right now.'
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleToggleFeature = async (badgeId, e) => {
    e?.stopPropagation();
    try {
      const res = await api.toggleFeatureBadge(badgeId);
      setAchievementsData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          badges: prev.badges.map((b) => (b.id === badgeId ? { ...b, featured: res.featured } : b))
        };
      });
      if (selectedBadge && selectedBadge.id === badgeId) {
        setSelectedBadge((prev) => ({ ...prev, featured: res.featured }));
      }
      setToast({
        type: 'info',
        title: res.featured ? 'Featured on Profile' : 'Hidden from Profile',
        message: res.featured
          ? 'This badge will appear as a verified crest on your Talent Feed posts.'
          : 'Badge removed from your public highlight chip.'
      });
    } catch (err) {
      setToast({
        type: 'error',
        title: 'Action failed',
        message: err.message
      });
    }
  };

  const handleDismissCelebration = async () => {
    if (!celebrationBadge) return;
    try {
      await api.markBadgeNotified(celebrationBadge.id);
    } catch {
      // silently ignore
    }
    setCelebrationBadge(null);
  };

  // Merge static registry info with user progress
  const badgesList = SVM_BADGES.map((b) => {
    const userBadge = achievementsData?.badges?.find((ub) => ub.id === b.id);
    return {
      ...b,
      unlocked: userBadge ? userBadge.unlocked : false,
      unlocked_at: userBadge?.unlocked_at || null,
      progress: userBadge ? userBadge.progress : 0,
      featured: userBadge ? userBadge.featured : false
    };
  });

  const filteredBadges = badgesList.filter((b) => {
    if (filter === 'all') return true;
    if (filter === 'earned') return b.unlocked;
    if (filter === 'locked') return !b.unlocked;
    return b.filterCategory === filter;
  });

  const summary = achievementsData?.summary || {
    badgesEarned: badgesList.filter((b) => b.unlocked).length,
    totalBadges: 12,
    totalXp: badgesList.filter((b) => b.unlocked).reduce((sum, b) => sum + b.xp, 0),
    weeklyXp: 150,
    verifiedMilestones: 2,
    certificatesEarned: 0
  };

  return (
    <div className="achievements-page">
      <Toast toast={toast} onClose={() => setToast(null)} />

      <PageHeader
        eyebrow="SVM Creative Recognition"
        title={
          <>
            My Creative Achievements. <em>Officially Verified.</em>
          </>
        }
        copy="Every step, every creation and every contribution makes your journey special."
        action={
          <div className="achievement-header-actions">
            <button
              className="button button-light btn-sm"
              onClick={() => setShowLeagueInfo(true)}
              title="Learn about Weekly Creative League"
            >
              <Icon name="spark" size={15} /> Weekly League Link
            </button>
            <button
              className="button button-primary btn-sm"
              onClick={handleVerifyNow}
              disabled={verifying}
            >
              <Icon name={verifying ? 'refresh' : 'checkCircle'} size={15} className={verifying ? 'spin' : ''} />
              {verifying ? 'Verifying...' : 'Verify Milestones'}
            </button>
          </div>
        }
      />

      {/* 4 Summary Stat Cards */}
      <section className="achievement-summary-grid">
        <div className="ach-stat-card">
          <div className="ach-stat-icon ach-icon-gold">
            <Icon name="badge" size={24} />
          </div>
          <div className="ach-stat-content">
            <span className="ach-stat-label">Badges Earned</span>
            <strong className="ach-stat-value">
              {summary.badgesEarned} <small>/ {summary.totalBadges}</small>
            </strong>
            <span className="ach-stat-sub">
              {Math.round((summary.badgesEarned / summary.totalBadges) * 100)}% of collection
            </span>
          </div>
        </div>

        <div className="ach-stat-card">
          <div className="ach-stat-icon ach-icon-purple">
            <Icon name="spark" size={24} />
          </div>
          <div className="ach-stat-content">
            <span className="ach-stat-label">Total Lifetime XP</span>
            <strong className="ach-stat-value">{summary.totalXp} XP</strong>
            <span className="ach-stat-sub">From verified milestones</span>
          </div>
        </div>

        <div className="ach-stat-card">
          <div className="ach-stat-icon ach-icon-blue">
            <Icon name="checkCircle" size={24} />
          </div>
          <div className="ach-stat-content">
            <span className="ach-stat-label">Verified Milestones</span>
            <strong className="ach-stat-value">{summary.verifiedMilestones}</strong>
            <span className="ach-stat-sub">Submissions & participations</span>
          </div>
        </div>

        <div className="ach-stat-card">
          <div className="ach-stat-icon ach-icon-emerald">
            <Icon name="shield" size={24} />
          </div>
          <div className="ach-stat-content">
            <span className="ach-stat-label">Certificates Earned</span>
            <strong className="ach-stat-value">{summary.certificatesEarned}</strong>
            <span className="ach-stat-sub">
              {summary.certificatesEarned > 0 ? 'Foundation Level Issued' : 'Unlock 4 badges to earn'}
            </span>
          </div>
        </div>
      </section>

      {/* Filter Tabs */}
      <div className="ach-filter-toolbar">
        <div className="ach-filter-tabs" role="tablist" aria-label="Achievement category filters">
          {BADGE_FILTER_TABS.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={filter === tab.id}
              className={filter === tab.id ? 'ach-tab-btn active' : 'ach-tab-btn'}
              onClick={() => setFilter(tab.id)}
            >
              {tab.label}
              {tab.id === 'earned' && ` (${summary.badgesEarned})`}
              {tab.id === 'locked' && ` (${summary.totalBadges - summary.badgesEarned})`}
            </button>
          ))}
        </div>
      </div>

      {/* 12 Official Badges Responsive Grid */}
      <section className="ach-badges-grid">
        {filteredBadges.map((badge) => {
          const isUnlocked = badge.unlocked;

          return (
            <article
              key={badge.id}
              className={`ach-badge-card ${isUnlocked ? 'is-unlocked' : 'is-locked'}`}
              onClick={() => setSelectedBadge(badge)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setSelectedBadge(badge);
                }
              }}
              aria-label={`${badge.name} badge - ${isUnlocked ? 'Earned' : 'Locked'}`}
            >
              {/* Badge State Ribbon / Pill */}
              <div className="ach-card-header">
                <span className="ach-cat-pill">{badge.category}</span>
                {isUnlocked ? (
                  <span className="ach-status-badge unlocked">
                    <Icon name="check" size={12} /> Earned
                  </span>
                ) : (
                  <span className="ach-status-badge locked">
                    <Icon name="lock" size={12} /> Locked
                  </span>
                )}
              </div>

              {/* Official Cropped Badge Artwork */}
              <div className="ach-image-container">
                <img
                  src={badge.image}
                  alt={`${badge.name} achievement badge`}
                  className={`ach-badge-img ${isUnlocked ? 'shine' : 'grayscale'}`}
                  loading="lazy"
                />
                {!isUnlocked && (
                  <div className="ach-lock-overlay" title="Locked milestone">
                    <div className="ach-lock-icon-circle">
                      <Icon name="lock" size={18} />
                    </div>
                  </div>
                )}
              </div>

              {/* Badge Name & Details */}
              <div className="ach-card-info">
                <h3 className="ach-badge-name">{badge.name}</h3>
                <p className="ach-badge-desc">{badge.description}</p>

                <div className="ach-criteria-box">
                  <span className="ach-criteria-label">Requirement:</span>
                  <p className="ach-criteria-text">{badge.requirement}</p>
                </div>

                {/* Progress or Earned Date */}
                {isUnlocked ? (
                  <div className="ach-earned-footer">
                    <span className="ach-earned-date">
                      Earned on {badge.unlocked_at ? badge.unlocked_at.slice(0, 10) : 'Recent Activity'}
                    </span>
                    <span className="ach-xp-tag">+{badge.xp} XP</span>
                  </div>
                ) : (
                  <div className="ach-progress-footer">
                    <div className="ach-progress-meta">
                      <span>Progress</span>
                      <span>{badge.progress}%</span>
                    </div>
                    <div className="progress-track">
                      <span style={{ width: `${badge.progress}%` }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="ach-card-footer-action">
                {isUnlocked ? (
                  <button
                    type="button"
                    className={`ach-feature-btn ${badge.featured ? 'featured' : ''}`}
                    onClick={(e) => handleToggleFeature(badge.id, e)}
                    title={badge.featured ? 'Featured on Talent Feed' : 'Showcase on Talent Feed'}
                  >
                    <Icon name={badge.featured ? 'check' : 'plus'} size={13} />
                    <span>{badge.featured ? 'Profile Highlight' : 'Feature on Feed'}</span>
                  </button>
                ) : (
                  <span className="ach-unlock-tip-link">Click for requirements</span>
                )}
              </div>
            </article>
          );
        })}
      </section>

      {/* Clean Detail Modal */}
      {selectedBadge && (
        <Modal
          isOpen={Boolean(selectedBadge)}
          title={selectedBadge.name}
          eyebrow={`Official SVM Badge · ${selectedBadge.category}`}
          onClose={() => setSelectedBadge(null)}
          maxWidth={560}
        >
          <div className="ach-modal-content">
            <div className="ach-modal-art-box">
              <img
                src={selectedBadge.image}
                alt={selectedBadge.name}
                className={`ach-modal-badge-img ${selectedBadge.unlocked ? 'shine' : 'grayscale'}`}
              />
              <div className="ach-modal-xp-pill">
                <Icon name="spark" size={14} /> +{selectedBadge.xp} Lifetime XP
              </div>
            </div>

            <div className="ach-modal-details">
              <div className="ach-modal-status-row">
                <span className={`ach-modal-status ${selectedBadge.unlocked ? 'unlocked' : 'locked'}`}>
                  <Icon name={selectedBadge.unlocked ? 'checkCircle' : 'lock'} size={16} />
                  {selectedBadge.unlocked ? 'Verified & Awarded' : 'Locked Milestone'}
                </span>
                {selectedBadge.unlocked_at && (
                  <span className="ach-modal-date">Awarded {selectedBadge.unlocked_at.slice(0, 10)}</span>
                )}
              </div>

              <h3>{selectedBadge.name}</h3>
              <p className="ach-modal-desc">{selectedBadge.description}</p>

              <div className="ach-modal-req-block">
                <strong>Official Requirement:</strong>
                <p>{selectedBadge.requirement}</p>
              </div>

              <div className="ach-modal-tip-block">
                <strong>How to complete:</strong>
                <p>{selectedBadge.tip}</p>
              </div>

              {selectedBadge.unlocked ? (
                <div className="ach-modal-actions">
                  <button
                    className={`button ${selectedBadge.featured ? 'button-primary' : 'button-light'} full-width`}
                    onClick={(e) => handleToggleFeature(selectedBadge.id, e)}
                  >
                    <Icon name={selectedBadge.featured ? 'check' : 'badge'} size={16} />
                    {selectedBadge.featured ? 'Featured on Profile & Feed' : 'Feature Badge on Profile'}
                  </button>
                </div>
              ) : (
                <div className="ach-modal-actions">
                  <button
                    className="button button-primary full-width"
                    onClick={() => {
                      setSelectedBadge(null);
                      if (selectedBadge.filterCategory === 'creativity' || selectedBadge.category === 'Singing' || selectedBadge.category === 'Dance' || selectedBadge.category === 'Photography' || selectedBadge.category === 'Literature' || selectedBadge.category === 'Art and Design' || selectedBadge.category === 'Instrumental Music') {
                        onNavigate('talent-feed');
                      } else if (selectedBadge.filterCategory === 'collaboration') {
                        onNavigate('collaborate');
                      } else {
                        onNavigate('discover-app');
                      }
                    }}
                  >
                    <Icon name="arrow" size={16} /> Start Earning This Badge
                  </button>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Badge Unlock Celebration Modal */}
      {celebrationBadge && (
        <Modal
          isOpen={Boolean(celebrationBadge)}
          title="Achievement Unlocked!"
          eyebrow="SVM Official Recognition"
          onClose={handleDismissCelebration}
          maxWidth={480}
        >
          <div className="celebration-container">
            <div className="celebration-confetti-sparkles" aria-hidden="true">
              <span className="sparkle s1">✨</span>
              <span className="sparkle s2">⭐</span>
              <span className="sparkle s3">✨</span>
              <span className="sparkle s4">🌟</span>
            </div>

            <div className="celebration-img-wrap">
              <img
                src={celebrationBadge.image}
                alt={celebrationBadge.name}
                className="celebration-badge-img"
              />
            </div>

            <h2>{celebrationBadge.name}</h2>
            <span className="celebration-category-pill">{celebrationBadge.category}</span>
            <p className="celebration-copy">
              Congratulations! You have officially verified the requirements for this achievement.
            </p>

            <div className="celebration-xp-award">
              <Icon name="spark" size={18} />
              <span>+{celebrationBadge.xp} XP added to your Creative Passport</span>
            </div>

            <div className="celebration-actions">
              <button
                className="button button-primary full-width"
                onClick={handleDismissCelebration}
              >
                Continue Exploring <Icon name="arrow" size={16} />
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Weekly Creative League Info Modal (Separate feature link) */}
      {showLeagueInfo && (
        <Modal
          isOpen={showLeagueInfo}
          title="Weekly Creative League"
          eyebrow="Campus Creative Pulse"
          onClose={() => setShowLeagueInfo(false)}
          maxWidth={500}
        >
          <div className="league-info-modal-body">
            <div className="league-info-icon">
              <Icon name="spark" size={32} />
            </div>
            <h3>Weekly Creative League</h3>
            <p>
              The Weekly Creative League celebrates peer encouragement, weekly participation, and artistic consistency across KLE Technological University campus.
            </p>
            <div className="league-stat-pills">
              <div className="league-pill">
                <strong>{summary.weeklyXp} XP</strong>
                <span>Your Weekly XP</span>
              </div>
              <div className="league-pill">
                <strong>Tier 1</strong>
                <span>Active Contributor</span>
              </div>
            </div>
            <p className="muted small-note">
              Weekly Creative League is a separate campus activity ranking based on weekly engagement. Lifetime achievement badges persist permanently in your Creative Passport.
            </p>
            <button
              className="button button-primary full-width"
              onClick={() => setShowLeagueInfo(false)}
            >
              Back to Achievements
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
