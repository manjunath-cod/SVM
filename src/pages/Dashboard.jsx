import React, { useState, useEffect } from 'react';
import { Icon } from '../components/Icons.jsx';
import { api } from '../services/api.js';

export function Dashboard({ onNavigate, currentUser }) {
  const [opportunities, setOpportunities] = useState([]);
  const [events, setEvents] = useState([]);
  const [userSubmissions, setUserSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [submissionData, oppData, evtData] = await Promise.all([
        api.getSubmissions().catch(() => ({ submissions: [] })),
        api.getOpportunities().catch(() => ({ opportunities: [] })),
        api.getEvents().catch(() => ({ events: [] }))
      ]);
      setUserSubmissions(submissionData?.submissions || []);
      setOpportunities(oppData?.opportunities || []);
      setEvents(evtData?.events || []);
    } catch (err) {
      console.warn('Dashboard data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const todayStr = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  return (
    <div className="dashboard-page">
      {/* Welcome Banner */}
      <section className="welcome-panel">
        <div className="welcome-copy">
          <p className="eyebrow">{todayStr}</p>
          <div className="welcome-status">
            <span />
            Your creative space is ready
          </div>
          <h1>Welcome back, {currentUser?.name?.split(' ')[0] || 'Creator'}.</h1>
          <p>Your creative ideas, AI evaluations, and collaborative campus network in one place.</p>
        </div>
        <div className="welcome-side">
          <div className="welcome-mark">
            <Icon name="spark" size={32} />
          </div>
          <div className="welcome-stats" aria-label="Creative space summary">
            <div>
              <strong>{userSubmissions.length}</strong>
              <span>Works shared</span>
            </div>
          </div>
        </div>
      </section>

      {/* Top 2 Action Cards */}
      <div className="dashboard-grid">
        {/* Continue Your Journey Card */}
        <section className="app-panel journey-card">
          <p className="eyebrow">Student Talent Community</p>
          <h2>Ready to share a new piece?</h2>
          <p className="muted">
            Share your singing, dance, photography, writing, or design with fellow students.
          </p>
          <button
            className="button button-primary"
            onClick={() => onNavigate('talent-feed')}
          >
            <Icon name="upload" size={16} /> Open Talent Feed
          </button>
        </section>
      </div>

      {/* Recommended Opportunities Section */}
      <section className="app-section">
        <div className="section-title-row">
          <div>
            <p className="eyebrow">Personalized For You</p>
            <h2>Find your next <em>yes.</em></h2>
          </div>
          <button className="text-link" onClick={() => onNavigate('discover-app')}>
            View all opportunities <Icon name="arrow" size={16} />
          </button>
        </div>

        <div className="opportunity-grid">
          {opportunities.slice(0, 3).map((item) => (
            <article className="opportunity-card" key={item.id}>
              <div className="card-kicker">
                <span>{item.category}</span>
                <span className="match-dot" />
              </div>
              <h3>{item.title}</h3>
              <p>{item.location} · {item.schedule}</p>
              <div className="match-note">
                {item.description.slice(0, 85)}...
              </div>
              <button
                className="card-link"
                onClick={() => onNavigate('discover-app')}
              >
                View details & register <Icon name="arrow" size={15} />
              </button>
            </article>
          ))}
        </div>
      </section>

      {/* Lower Dashboard Grid: Activity & Upcoming Events */}
      <div className="dashboard-lower">
        {/* Recent Activity */}
        <section className="app-panel activity-panel">
          <div className="section-title-row">
            <div>
              <p className="eyebrow">Your Activity</p>
              <h2>Small steps count.</h2>
            </div>
            {userSubmissions.length > 0 && (
              <button className="text-link" onClick={() => onNavigate('portfolio')}>
                Portfolio ({userSubmissions.length})
              </button>
            )}
          </div>

          {userSubmissions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <Icon name="spark" size={20} />
              </div>
              <p>No activity yet</p>
              <span>Register for an event or upload your first creative work to begin.</span>
            </div>
          ) : (
            <div className="recent-activity-list">
              {userSubmissions.slice(0, 3).map((sub) => (
                <div className="activity-item-row" key={sub.id}>
                  <div className="act-icon">
                    <Icon name="spark" size={16} />
                  </div>
                  <div className="act-details">
                    <strong>Submitted "{sub.title}"</strong>
                    <span>
                      {sub.category} · Status: {sub.status} · {sub.created_at?.slice(0, 10)}
                    </span>
                  </div>
                  <button
                    className="icon-button"
                    onClick={() => onNavigate('portfolio')}
                    title="View in portfolio"
                  >
                    <Icon name="arrow" size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Upcoming Events */}
        <section className="app-panel upcoming-panel">
          <div className="section-title-row">
            <div>
              <p className="eyebrow">Coming Up</p>
              <h2>On the campus calendar.</h2>
            </div>
            <button className="text-link" onClick={() => onNavigate('events-app')}>
              All events
            </button>
          </div>

          <div className="mini-events-feed">
            {events.slice(0, 3).map((evt) => (
              <div
                className="mini-event"
                key={evt.id}
                onClick={() => onNavigate('events-app')}
                role="button"
                tabIndex={0}
              >
                <div className="mini-date">
                  <strong>{evt.date}</strong>
                  <span>{evt.month}</span>
                </div>
                <div>
                  <h3>{evt.title}</h3>
                  <p>{evt.venue} · {evt.time}</p>
                </div>
                <Icon name="arrow" size={16} />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
