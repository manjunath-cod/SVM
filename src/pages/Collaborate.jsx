import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/Navigation.jsx';
import { Icon } from '../components/Icons.jsx';
import { Modal } from '../components/Modal.jsx';
import { Toast } from '../components/Toast.jsx';
import { api } from '../services/api.js';
import { CREATIVE_CATEGORIES } from '../data/talentFeed.js';

export function Collaborate({ onNavigate }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDiscipline, setFilterDiscipline] = useState('all');

  // New Collaboration Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [authorDiscipline, setAuthorDiscipline] = useState('videography');
  const [seekingDisciplines, setSeekingDisciplines] = useState(['music']);
  const [creating, setCreating] = useState(false);

  // Send Request Modal
  const [selectedPost, setSelectedPost] = useState(null);
  const [requestMessage, setRequestMessage] = useState('');
  const [sendingRequest, setSendingRequest] = useState(false);

  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadCollaborations();
  }, [filterDiscipline]);

  const loadCollaborations = async () => {
    setLoading(true);
    try {
      const data = await api.getCollaborations(filterDiscipline);
      setPosts(data.posts || []);
    } catch (err) {
      console.warn('Failed to load collaborations:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSeeking = (disciplineId) => {
    if (seekingDisciplines.includes(disciplineId)) {
      setSeekingDisciplines(seekingDisciplines.filter((d) => d !== disciplineId));
    } else {
      setSeekingDisciplines([...seekingDisciplines, disciplineId]);
    }
  };

  const handleCreateCollab = async (e) => {
    e.preventDefault();
    if (!projectTitle.trim() || !projectDescription.trim()) {
      return;
    }
    setCreating(true);
    try {
      await api.createCollaboration({
        project_title: projectTitle.trim(),
        description: projectDescription.trim(),
        author_discipline: authorDiscipline,
        seeking_disciplines: seekingDisciplines
      });
      setToast({
        type: 'success',
        title: 'Callout Posted!',
        message: 'Your collaboration request is live for SVM creators.'
      });
      setModalOpen(false);
      setProjectTitle('');
      setProjectDescription('');
      loadCollaborations();
    } catch (err) {
      setToast({
        type: 'error',
        title: 'Error posting collaboration',
        message: err.message
      });
    } finally {
      setCreating(false);
    }
  };

  const handleSendRequest = async (e) => {
    e.preventDefault();
    if (!selectedPost) return;
    setSendingRequest(true);
    try {
      await api.sendCollaborationRequest(selectedPost.id, requestMessage);
      setToast({
        type: 'success',
        title: 'Request Sent!',
        message: `Your message was delivered to ${selectedPost.author_name}.`
      });
      setSelectedPost(null);
      setRequestMessage('');
      loadCollaborations();
    } catch (err) {
      setToast({
        type: 'error',
        title: 'Could not send request',
        message: err.message
      });
    } finally {
      setSendingRequest(false);
    }
  };

  return (
    <div className="collaborate-page">
      <PageHeader
        eyebrow="Campus Creative Matchmaking"
        title={
          <>
            Find your people. <em>Create together.</em>
          </>
        }
        copy="Great things happen at the intersection of disciplines. Connect with musicians, animators, writers, actors, and designers looking for partners across SVM."
        action={
          <button
            className="button button-primary"
            onClick={() => setModalOpen(true)}
          >
            <Icon name="upload" size={16} /> Post a Project Callout
          </button>
        }
      />

      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      {/* Filter Chips */}
      <div className="collab-filter-row">
        <span className="filter-label">Filter by discipline:</span>
        <div className="filter-chips-list">
          <button
            className={filterDiscipline === 'all' ? 'chip selected' : 'chip'}
            onClick={() => setFilterDiscipline('all')}
          >
            All Projects
          </button>
          {CREATIVE_CATEGORIES.slice(0, 8).map((cat) => (
            <button
              key={cat.id}
              className={filterDiscipline === cat.id ? 'chip selected' : 'chip'}
              onClick={() => setFilterDiscipline(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <Icon name="refresh" size={24} className="spin" />
          <p>Connecting campus creative networks...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <Icon name="users" size={24} />
          </div>
          <p>No collaboration requests yet in this category</p>
          <span>Have an idea for a short film, song, zine, or dance performance? Be the first to start a collaboration.</span>
          <button
            className="button button-primary"
            onClick={() => setModalOpen(true)}
          >
            Post a Project Callout <Icon name="arrow" size={16} />
          </button>
        </div>
      ) : (
        <div className="collab-posts-grid">
          {posts.map((post) => (
            <article className="collab-card" key={post.id}>
              <div className="collab-card-top">
                <div className="author-pill">
                  <span className="avatar-circle">
                    {post.author_name?.slice(0, 2).toUpperCase() || 'SV'}
                  </span>
                  <div>
                    <strong>{post.author_name}</strong>
                    <span>{post.author_department}</span>
                  </div>
                </div>
                <span className="discipline-badge">{post.author_discipline}</span>
              </div>

              <h3>{post.project_title}</h3>
              <p className="collab-desc">{post.description}</p>

              <div className="seeking-row">
                <span className="seeking-label">Seeking Partners in:</span>
                <div className="seeking-tags">
                  {post.seeking_disciplines?.map((d) => (
                    <span key={d} className="seeking-pill">
                      + {d}
                    </span>
                  ))}
                </div>
              </div>

              <div className="collab-card-footer">
                <span className="requests-count">
                  <Icon name="users" size={14} /> {post.requests_count} interested
                </span>

                <button
                  className="button button-dark btn-sm"
                  onClick={() => {
                    setSelectedPost(post);
                    setRequestMessage(`Hi ${post.author_name}! I saw your callout for "${post.project_title}" and I would love to collaborate.`);
                  }}
                >
                  Connect & Join <Icon name="arrow" size={14} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Modal: Create Collaboration Callout */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        eyebrow="New Collaboration Callout"
        title="What are you building?"
      >
        <form onSubmit={handleCreateCollab}>
          <label htmlFor="collab-title">Project Title *</label>
          <input
            id="collab-title"
            type="text"
            placeholder="e.g. Ambient soundtrack for 10-min short film"
            value={projectTitle}
            onChange={(e) => setProjectTitle(e.target.value)}
            required
          />

          <label htmlFor="collab-author-disc">Your Primary Discipline</label>
          <select
            id="collab-author-disc"
            value={authorDiscipline}
            onChange={(e) => setAuthorDiscipline(e.target.value)}
          >
            {CREATIVE_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>

          <label htmlFor="collab-desc">Project Overview & What You Need *</label>
          <textarea
            id="collab-desc"
            rows={4}
            placeholder="Describe the concept, current progress, timeline, and what kind of collaborator would make it happen..."
            value={projectDescription}
            onChange={(e) => setProjectDescription(e.target.value)}
            required
          />

          <label>Seeking Complementary Disciplines</label>
          <div className="seeking-select-cloud">
            {CREATIVE_CATEGORIES.map((cat) => {
              const isSelected = seekingDisciplines.includes(cat.id);
              return (
                <button
                  key={cat.id}
                  type="button"
                  className={isSelected ? 'chip selected' : 'chip'}
                  onClick={() => handleToggleSeeking(cat.id)}
                >
                  {isSelected && <Icon name="check" size={12} />} {cat.label}
                </button>
              );
            })}
          </div>

          <button
            className="button button-primary full-width modal-submit-btn"
            type="submit"
            disabled={creating}
          >
            {creating ? 'Publishing callout...' : 'Publish Collaboration Callout'} <Icon name="arrow" size={16} />
          </button>
        </form>
      </Modal>

      {/* Modal: Send Collaboration Message */}
      <Modal
        isOpen={Boolean(selectedPost)}
        onClose={() => setSelectedPost(null)}
        eyebrow="Express Interest"
        title={`Collaborate with ${selectedPost?.author_name}`}
      >
        <form onSubmit={handleSendRequest}>
          <p className="modal-copy">
            Sending a response to: <strong>"{selectedPost?.project_title}"</strong>
          </p>

          <label htmlFor="req-message">Your Introduction & Collaboration Note</label>
          <textarea
            id="req-message"
            rows={4}
            placeholder="Introduce yourself, share your relevant experience or ideas, and mention what you'd bring to this project..."
            value={requestMessage}
            onChange={(e) => setRequestMessage(e.target.value)}
            required
          />

          <button
            className="button button-primary full-width modal-submit-btn"
            type="submit"
            disabled={sendingRequest}
          >
            {sendingRequest ? 'Sending...' : 'Send Collaboration Request'} <Icon name="arrow" size={16} />
          </button>
        </form>
      </Modal>
    </div>
  );
}
