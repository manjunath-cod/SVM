import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/Navigation.jsx';
import { Icon } from '../components/Icons.jsx';
import { MediaViewer } from '../components/MediaViewer.jsx';
import { Modal } from '../components/Modal.jsx';
import { api } from '../services/api.js';

export function Portfolio({ onNavigate }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterVisibility, setFilterVisibility] = useState('all');
  const [selectedSub, setSelectedSub] = useState(null);

  useEffect(() => {
    loadPortfolio();
  }, []);

  const loadPortfolio = async () => {
    setLoading(true);
    try {
      const data = await api.getSubmissions('user', 'all');
      setSubmissions(data.submissions || []);
    } catch (err) {
      console.warn('Failed to load user portfolio:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const filtered = submissions.filter((s) => {
    if (filterVisibility === 'all') return true;
    return s.visibility === filterVisibility;
  });

  return (
    <div className="portfolio-page">
      <PageHeader
        eyebrow="My Creative Portfolio"
        title={
          <>
            A considered home <em>for your creative work.</em>
          </>
        }
        copy="Your cataloged recordings, visual pieces, writings, and experiments. Track your artistic trajectory and AI mentorship insights over time."
        action={
          <button
            className="button button-primary"
            onClick={() => onNavigate('showcase-app')}
          >
            <Icon name="upload" size={16} /> Submit New Work
          </button>
        }
      />

      {/* Visibility Filters */}
      <div className="portfolio-filter-row">
        <div className="filter-chips-list">
          <button
            className={filterVisibility === 'all' ? 'chip selected' : 'chip'}
            onClick={() => setFilterVisibility('all')}
          >
            All Works ({submissions.length})
          </button>
          <button
            className={filterVisibility === 'campus' ? 'chip selected' : 'chip'}
            onClick={() => setFilterVisibility('campus')}
          >
            <Icon name="users" size={13} /> Campus Showcase
          </button>
          <button
            className={filterVisibility === 'public' ? 'chip selected' : 'chip'}
            onClick={() => setFilterVisibility('public')}
          >
            <Icon name="globe" size={13} /> Public
          </button>
          <button
            className={filterVisibility === 'private' ? 'chip selected' : 'chip'}
            onClick={() => setFilterVisibility('private')}
          >
            <Icon name="lock" size={13} /> Private
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <Icon name="refresh" size={24} className="spin" />
          <p>Loading your portfolio works...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <Icon name="portfolio" size={24} />
          </div>
          <p>No works found in this view</p>
          <span>Share your first song, photograph, painting, or poem to start building your portfolio.</span>
          <button
            className="button button-primary"
            onClick={() => onNavigate('showcase-app')}
          >
            <Icon name="upload" size={16} /> Upload your first work
          </button>
        </div>
      ) : (
        <div className="portfolio-grid">
          {filtered.map((item) => (
            <article className="portfolio-card" key={item.id}>
              <div className="portfolio-card-media">
                <MediaViewer
                  fileUrl={item.file_url}
                  fileType={item.file_type}
                  fileName={item.file_name}
                  title={item.title}
                />
                <span className={`visibility-badge vis-${item.visibility}`}>
                  <Icon name={item.visibility === 'private' ? 'lock' : 'users'} size={11} /> {item.visibility}
                </span>
              </div>

              <div className="portfolio-card-body">
                <div className="card-kicker">
                  <span>{item.category}</span>
                  <span className="card-date">{item.created_at?.slice(0, 10)}</span>
                </div>

                <h3>{item.title}</h3>
                <p className="portfolio-desc">{item.description || 'No description provided.'}</p>

                {/* AI Evaluation Highlights */}
                {item.evaluation ? (
                  <div className="portfolio-ai-pill">
                    <Icon name="spark" size={13} />
                    <span>
                      {item.evaluation.overall_score
                        ? `AI Score: ${item.evaluation.overall_score.toFixed(1)} / 10`
                        : 'Feedback recorded'}
                    </span>
                  </div>
                ) : (
                  <span className="portfolio-pending-pill">Awaiting AI evaluation</span>
                )}

                <div className="portfolio-card-actions">
                  <button
                    className="button button-light btn-sm full-width"
                    onClick={() => setSelectedSub(item)}
                  >
                    View Details & Feedback <Icon name="arrow" size={14} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Modal: View Details and Feedback */}
      <Modal
        isOpen={Boolean(selectedSub)}
        onClose={() => setSelectedSub(null)}
        eyebrow="Creative Work Details"
        title={selectedSub?.title || 'Submission Details'}
        maxWidth={620}
      >
        {selectedSub && (
          <div className="modal-portfolio-detail">
            <MediaViewer
              fileUrl={selectedSub.file_url}
              fileType={selectedSub.file_type}
              fileName={selectedSub.file_name}
              title={selectedSub.title}
            />

            <div className="modal-detail-meta">
              <span>Category: <strong>{selectedSub.category}</strong></span>
              <span> · </span>
              <span>Experience: <strong>{selectedSub.experience_level}</strong></span>
              <span> · </span>
              <span>Visibility: <strong>{selectedSub.visibility}</strong></span>
            </div>

            <p className="modal-detail-desc">{selectedSub.description}</p>

            {selectedSub.evaluation ? (
              <div className="modal-eval-box">
                <div className="eval-box-top">
                  <span className="badge-pill">
                    <Icon name="spark" size={13} /> Gemini AI Feedback
                  </span>
                  {selectedSub.evaluation.overall_score && (
                    <strong className="badge-score">
                      {selectedSub.evaluation.overall_score.toFixed(1)} / 10
                    </strong>
                  )}
                </div>
                <p className="eval-box-summary">{selectedSub.evaluation.summary}</p>
                {selectedSub.evaluation.strengths?.length > 0 && (
                  <div className="eval-box-strengths">
                    <strong>Strengths:</strong>
                    <ul>
                      {selectedSub.evaluation.strengths.map((s, idx) => (
                        <li key={idx}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p className="muted-notice">No AI evaluation has been processed for this piece yet.</p>
            )}

            <div className="modal-actions-row">
              <button
                className="button button-dark"
                onClick={() => setSelectedSub(null)}
              >
                Done
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

