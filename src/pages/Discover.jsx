import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/Navigation.jsx';
import { Icon } from '../components/Icons.jsx';
import { Toast } from '../components/Toast.jsx';
import { api } from '../services/api.js';
import { CREATIVE_CATEGORIES } from '../data/talentFeed.js';

export function Discover({ onNavigate }) {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [type, setType] = useState('all');
  const [registeringId, setRegisteringId] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadOpportunities();
  }, [category, type]);

  const loadOpportunities = async () => {
    setLoading(true);
    try {
      const data = await api.getOpportunities({ category, type, search });
      setOpportunities(data.opportunities || []);
    } catch (err) {
      console.warn('Failed to load opportunities:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadOpportunities();
  };

  const handleToggleRegister = async (oppId, title) => {
    setRegisteringId(oppId);
    try {
      const res = await api.registerOpportunity(oppId);
      setToast({
        type: res.registered ? 'success' : 'info',
        title: res.registered ? 'Registered!' : 'Cancelled',
        message: res.registered
          ? `You are now registered for "${title}". Details saved to your Creative Passport.`
          : `Registration for "${title}" has been cancelled.`
      });
      loadOpportunities();
    } catch (err) {
      setToast({
        type: 'error',
        title: 'Registration failed',
        message: err.message
      });
    } finally {
      setRegisteringId(null);
    }
  };

  return (
    <div className="discover-page">
      <PageHeader
        eyebrow="SVM Cultural Opportunities"
        title={
          <>
            Find your next <em>creative opportunity.</em>
          </>
        }
        copy="Workshops, open auditions, collaborative sprints, and creative challenges across SVM Institute of Technology. Beginner-friendly and no prerequisites required."
        action={
          <button
            className="button button-dark"
            onClick={() => onNavigate('passport')}
          >
            <Icon name="compass" size={16} /> My Passport Interests
          </button>
        }
      />

      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      {/* Discover Toolbar */}
      <div className="discover-toolbar-box">
        <form className="search-form" onSubmit={handleSearchSubmit}>
          <div className="search-field">
            <Icon name="search" size={18} />
            <input
              type="text"
              placeholder="Search by keywords, clubs, or skills..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="button button-dark btn-search" type="submit">
            Search
          </button>
        </form>

        <div className="filter-selects-row">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="Filter by category"
          >
            <option value="all">All Categories</option>
            {CREATIVE_CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.label}
              </option>
            ))}
          </select>

          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            aria-label="Filter by opportunity type"
          >
            <option value="all">All Formats</option>
            <option value="workshop">Workshops & Intensives</option>
            <option value="audition">Auditions & Open Stage</option>
            <option value="collaboration">Collaborative Sprints</option>
            <option value="challenge">Creative Challenges</option>
          </select>
        </div>
      </div>

      {/* Opportunities List */}
      {loading ? (
        <div className="loading-state">
          <Icon name="refresh" size={24} className="spin" />
          <p>Finding creative opportunities across campus...</p>
        </div>
      ) : opportunities.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <Icon name="search" size={24} />
          </div>
          <p>No matching opportunities found</p>
          <span>Try loosening your search terms or selecting another category.</span>
          <button
            className="button button-light"
            onClick={() => {
              setSearch('');
              setCategory('all');
              setType('all');
            }}
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="opportunities-feed">
          {opportunities.map((opp) => {
            const isRegistered = Boolean(opp.user_registration_status);
            return (
              <article className="opportunity-full-card" key={opp.id}>
                <div className="opp-left-accent">
                  <div className="opp-category-icon">
                    <Icon name={opp.category === 'singing' || opp.category === 'music' ? 'mic' : opp.category === 'photography' ? 'camera' : 'spark'} size={24} />
                  </div>
                </div>

                <div className="opp-card-content">
                  <div className="opp-tags-row">
                    <span className="opp-category-pill">{opp.category}</span>
                    <span className="opp-type-pill">{opp.type}</span>
                    <span className="opp-diff-pill">{opp.difficulty}</span>
                    {isRegistered && (
                      <span className="opp-registered-pill">
                        <Icon name="check" size={12} /> Registered
                      </span>
                    )}
                  </div>

                  <h2>{opp.title}</h2>
                  <p className="opp-desc">{opp.description}</p>

                  <div className="opp-meta-grid">
                    <div>
                      <strong>Location:</strong> {opp.location}
                    </div>
                    <div>
                      <strong>Schedule:</strong> {opp.schedule}
                    </div>
                    <div>
                      <strong>Organizer:</strong> {opp.organizer}
                    </div>
                    <div>
                      <strong>Prerequisites:</strong> {opp.prerequisites}
                    </div>
                  </div>

                  <div className="opp-card-footer">
                    <div className="opp-spots-count">
                      <Icon name="users" size={15} />
                      <span>
                        {opp.registered_count} / {opp.spots_total} spots filled
                      </span>
                    </div>

                    <button
                      className={`button ${isRegistered ? 'button-light button-registered' : 'button-primary'}`}
                      onClick={() => handleToggleRegister(opp.id, opp.title)}
                      disabled={registeringId === opp.id}
                    >
                      <Icon name={isRegistered ? 'check' : 'arrow'} size={15} />
                      {registeringId === opp.id
                        ? 'Updating...'
                        : isRegistered
                        ? 'Registered (Cancel)'
                        : 'Register / Express Interest'}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
