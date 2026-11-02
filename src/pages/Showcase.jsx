import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/Navigation.jsx';
import { Icon } from '../components/Icons.jsx';
import { MediaViewer } from '../components/MediaViewer.jsx';
import { api } from '../services/api.js';

export const CREATIVE_CATEGORIES = [
  { id: 'singing', label: 'Singing & Vocals', icon: 'mic', hint: 'Solos, harmonies, classical, contemporary' },
  { id: 'music', label: 'Music Production', icon: 'music', hint: 'Original beats, songwriting, electronic, DAW mixes' },
  { id: 'instrumental_music', label: 'Instrumental Music', icon: 'music', hint: 'Guitar, keyboard, drums, violin, flute, percussion' },
  { id: 'dance', label: 'Dance & Movement', icon: 'spark', hint: 'Contemporary, classical, hip-hop, folk, freestyle' },
  { id: 'photography', label: 'Photography', icon: 'camera', hint: 'Portraits, architecture, street, documentary, nature' },
  { id: 'videography', label: 'Videography & Film', icon: 'video', hint: 'Short films, cinematography, reels, documentaries' },
  { id: 'painting', label: 'Painting & Fine Arts', icon: 'pen', hint: 'Watercolors, acrylics, sketches, digital art' },
  { id: 'graphic_design', label: 'Graphic Design', icon: 'layout', hint: 'Posters, brand identities, typography, UI mockups' },
  { id: 'writing', label: 'Creative Writing', icon: 'pen', hint: 'Short stories, essays, flash fiction, screenplays' },
  { id: 'poetry', label: 'Poetry & Spoken Word', icon: 'pen', hint: 'Free verse, rhymed, spoken word performance' },
  { id: 'anchoring', label: 'Anchoring & Emceeing', icon: 'mic', hint: 'Event hosting, public speaking, stage moderation' },
  { id: 'acting', label: 'Acting & Monologues', icon: 'drama', hint: 'Character monologues, scene work, comedic skits' },
  { id: 'theatre', label: 'Theatre & Stagecraft', icon: 'drama', hint: 'Stage direction, scriptwriting, prop & set design' },
  { id: 'event_management', label: 'Event Management', icon: 'calendar', hint: 'Fest concept proposals, stage workflows, logistics' },
  { id: 'other', label: 'Other Creative Arts', icon: 'spark', hint: 'Cross-disciplinary, origami, craft, animation' }
];

export function Showcase({ onNavigate }) {
  const [activeTab, setActiveTab] = useState('submit'); // 'submit' | 'feed'
  const [submissions, setSubmissions] = useState([]);
  const [filterCategory, setFilterCategory] = useState('all');
  const [loadingFeed, setLoadingFeed] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('singing');
  const [description, setDescription] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('beginner');
  const [confidenceLevel, setConfidenceLevel] = useState('exploring');
  const [visibility, setVisibility] = useState('campus');
  const [aiConsent, setAiConsent] = useState(true);

  // File states
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileBase64, setFileBase64] = useState(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState(null);
  const [fileError, setFileError] = useState(null);

  // Submission & evaluation feedback
  const [submitting, setSubmitting] = useState(false);
  const [evaluatingStep, setEvaluatingStep] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(null); // contains { submission, evaluation }
  const [errorMessage, setErrorMessage] = useState(null);
  const [reEvaluating, setReEvaluating] = useState(false);

  useEffect(() => {
    loadSubmissions();
  }, [filterCategory]);

  const loadSubmissions = async () => {
    setLoadingFeed(true);
    try {
      const data = await api.getSubmissions('all', filterCategory);
      setSubmissions(data.submissions || []);
    } catch (err) {
      console.warn('Failed to load submissions:', err.message);
    } finally {
      setLoadingFeed(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileError(null);

    // Max 25 MB restriction
    if (file.size > 25 * 1024 * 1024) {
      setFileError('File size exceeds the 25 MB limit. Please select a smaller file or compress it.');
      return;
    }

    setSelectedFile(file);

    // Generate local preview URL
    const previewUrl = URL.createObjectURL(file);
    setFilePreviewUrl(previewUrl);

    // Read as Base64 for upload
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      const base64String = result.split(',')[1];
      setFileBase64(base64String);
    };
    reader.onerror = () => {
      setFileError('Failed to read file from disk.');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage('Please provide a title for your creative work.');
      return;
    }
    if (!selectedFile && !description.trim()) {
      setErrorMessage('Please either upload a media file or provide a detailed creative description.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    setEvaluatingStep('Uploading creative file and metadata...');

    try {
      if (aiConsent) {
        setTimeout(() => setEvaluatingStep('Transmitting to Gemini AI evaluation engine...'), 600);
        setTimeout(() => setEvaluatingStep('Applying category-specific rubrics...'), 1500);
      }

      const payload = {
        title: title.trim(),
        category,
        description: description.trim(),
        experience_level: experienceLevel,
        confidence_level: confidenceLevel,
        visibility,
        ai_consent: aiConsent ? 1 : 0,
        fileName: selectedFile?.name || null,
        fileType: selectedFile?.type || null,
        fileSize: selectedFile?.size || 0,
        fileBase64: fileBase64 || null
      };

      const result = await api.uploadSubmission(payload);
      setSubmitSuccess(result);
      loadSubmissions();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to submit creative work. Please try again.');
    } finally {
      setSubmitting(false);
      setEvaluatingStep('');
    }
  };

  const handleReEvaluate = async (submissionId) => {
    setReEvaluating(true);
    try {
      const result = await api.evaluateSubmission(submissionId);
      if (submitSuccess?.submission?.id === submissionId) {
        setSubmitSuccess((prev) => ({
          ...prev,
          evaluation: result.evaluation
        }));
      }
      loadSubmissions();
    } catch (err) {
      setErrorMessage(`Re-evaluation failed: ${err.message}`);
    } finally {
      setReEvaluating(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setSelectedFile(null);
    setFileBase64(null);
    setFilePreviewUrl(null);
    setSubmitSuccess(null);
    setErrorMessage(null);
    setFileError(null);
  };

  return (
    <div className="showcase-page">
      <PageHeader
        eyebrow="AI Talent Discovery & Showcase"
        title={
          <>
            Discover your creative voice. <em>Get genuine feedback.</em>
          </>
        }
        copy="Share your creative work, receive category-specific Gemini AI evaluation tailored to your craft, and find opportunities across SVM."
        action={
          <div className="tab-pill-group">
            <button
              className={activeTab === 'submit' ? 'tab-pill active' : 'tab-pill'}
              onClick={() => setActiveTab('submit')}
            >
              <Icon name="upload" size={15} /> Submit Work
            </button>
            <button
              className={activeTab === 'feed' ? 'tab-pill active' : 'tab-pill'}
              onClick={() => setActiveTab('feed')}
            >
              <Icon name="spark" size={15} /> Campus Showcase ({submissions.length})
            </button>
          </div>
        }
      />

      {/* ERROR BANNER */}
      {errorMessage && (
        <div className="alert-banner alert-error">
          <Icon name="alert" size={20} />
          <div>
            <strong>Notice</strong>
            <p>{errorMessage}</p>
          </div>
          <button className="icon-button" onClick={() => setErrorMessage(null)}>
            <Icon name="close" size={16} />
          </button>
        </div>
      )}

      {/* SUBMISSION SUCCESS & EVALUATION VIEW */}
      {submitSuccess && (
        <section className="app-panel evaluation-result-panel">
          <div className="eval-panel-header">
            <div>
              <span className="tag-soft">Evaluation Complete</span>
              <h2>{submitSuccess.submission.title}</h2>
              <p className="eval-submeta">
                <span>Category: <strong>{submitSuccess.submission.category.toUpperCase()}</strong></span>
                <span> · </span>
                <span>Experience: <strong>{submitSuccess.submission.experience_level}</strong></span>
                <span> · </span>
                <span>Visibility: <strong>{submitSuccess.submission.visibility}</strong></span>
              </p>
            </div>
            <div className="score-hero-box">
              {submitSuccess.evaluation?.overallScore ? (
                <>
                  <div className="score-large">
                    {submitSuccess.evaluation.overallScore.toFixed(1)}
                    <span className="score-out-of">/10</span>
                  </div>
                  <span className="score-label">Overall Rubric Score</span>
                  <span className={`confidence-badge conf-${submitSuccess.evaluation.confidence_rating}`}>
                    <Icon name="shield" size={12} /> {submitSuccess.evaluation.confidence_rating} confidence
                  </span>
                </>
              ) : (
                <div className="score-unscored">
                  <Icon name="info" size={22} />
                  <span>Descriptive Feedback Only</span>
                  <small>No score assigned</small>
                </div>
              )}
            </div>
          </div>

          {/* Media Evaluated Diagnostic Tag */}
          <div className="media-verification-bar">
            <Icon name={submitSuccess.evaluation?.media_evaluated ? 'checkCircle' : 'info'} size={16} />
            <span>
              {submitSuccess.evaluation?.media_notes || 'Media inspected and processed by Gemini multimodal analyzer.'}
            </span>
          </div>

          {/* Evaluator Summary */}
          {submitSuccess.evaluation?.summary && (
            <div className="eval-section">
              <h3 className="eval-section-title">Artistic Summary</h3>
              <p className="eval-summary-text">{submitSuccess.evaluation.summary}</p>
            </div>
          )}

          {/* Rubric Breakdown Grid */}
          {submitSuccess.evaluation?.rubric_scores?.length > 0 && (
            <div className="eval-section">
              <h3 className="eval-section-title">Category-Specific Rubric Breakdown</h3>
              <div className="rubric-grid">
                {submitSuccess.evaluation.rubric_scores.map((r, idx) => (
                  <div className="rubric-card" key={idx}>
                    <div className="rubric-top">
                      <strong>{r.criterion}</strong>
                      <span className="rubric-score-badge">{r.score} / 10</span>
                    </div>
                    <div className="rubric-bar">
                      <div className="rubric-bar-fill" style={{ width: `${Math.min(r.score * 10, 100)}%` }} />
                    </div>
                    <p className="rubric-obs">{r.observation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Individualized Observations */}
          {submitSuccess.evaluation?.detailed_observations?.length > 0 && (
            <div className="eval-section">
              <h3 className="eval-section-title">Individualized Observations</h3>
              <ul className="bullet-list">
                {submitSuccess.evaluation.detailed_observations.map((obs, idx) => (
                  <li key={idx}>{obs}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Strengths & Areas for Improvement Two-Column */}
          <div className="eval-two-col">
            <div className="eval-col strength-col">
              <h3>
                <Icon name="checkCircle" size={18} /> Observed Strengths
              </h3>
              <ul>
                {submitSuccess.evaluation?.strengths?.map((s, idx) => (
                  <li key={idx}>{s}</li>
                ))}
              </ul>
            </div>

            <div className="eval-col improvement-col">
              <h3>
                <Icon name="spark" size={18} /> Areas for Growth
              </h3>
              <ul>
                {submitSuccess.evaluation?.areas_for_improvement?.map((imp, idx) => (
                  <li key={idx}>{imp}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Practical Exercises */}
          {submitSuccess.evaluation?.practical_exercises?.length > 0 && (
            <div className="eval-section">
              <h3 className="eval-section-title">Recommended Practical Exercises</h3>
              <div className="exercise-grid">
                {submitSuccess.evaluation.practical_exercises.map((ex, idx) => (
                  <div className="exercise-card" key={idx}>
                    <span className="exercise-frequency">{ex.frequency}</span>
                    <h4>{ex.title}</h4>
                    <p className="exercise-desc">{ex.description}</p>
                    <div className="exercise-outcome">
                      <strong>Target Outcome:</strong> {ex.targetOutcome}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SVM Campus Community & Activities */}
          {submitSuccess.evaluation?.recommended_svm_activities?.length > 0 && (
            <div className="eval-section">
              <h3 className="eval-section-title">Recommended SVM Activities & Communities</h3>
              <div className="activity-recs-grid">
                {submitSuccess.evaluation.recommended_svm_activities.map((act, idx) => (
                  <div className="activity-rec-card" key={idx}>
                    <div className="activity-type-badge">{act.type}</div>
                    <h4>{act.name}</h4>
                    <p>{act.reason}</p>
                    <button
                      className="text-link"
                      onClick={() => onNavigate('discover-app')}
                    >
                      Find corresponding SVM sessions <Icon name="arrow" size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Limitations Disclaimer */}
          <div className="eval-disclaimer-box">
            <Icon name="info" size={18} />
            <div>
              <strong>Academic Integrity & AI Boundaries:</strong>
              <p>
                {submitSuccess.evaluation?.limitations_disclaimer ||
                  'Automated evaluation is limited to the uploaded digital artifact. It is designed to encourage self-directed practice and does not assess personal creative worth.'}
              </p>
            </div>
          </div>

          {/* Panel Footer Actions */}
          <div className="eval-actions-footer">
            <button
              className="button button-dark"
              onClick={() => handleReEvaluate(submitSuccess.submission.id)}
              disabled={reEvaluating}
            >
              <Icon name="refresh" size={16} />
              {reEvaluating ? 'Re-evaluating with Gemini...' : 'Re-run Evaluation'}
            </button>
            <button
              className="button button-light"
              onClick={() => onNavigate('portfolio')}
            >
              <Icon name="portfolio" size={16} /> View in My Portfolio
            </button>
            <button className="button button-primary" onClick={resetForm}>
              <Icon name="upload" size={16} /> Submit Another Piece
            </button>
          </div>
        </section>
      )}

      {/* SUBMISSION FORM (Active when tab is 'submit' and not reviewing an evaluation) */}
      {activeTab === 'submit' && !submitSuccess && (
        <form onSubmit={handleSubmit} className="showcase-form-layout">
          {/* Left Column: Creative Details & Settings */}
          <section className="app-panel form-panel">
            <div className="section-title-row">
              <div>
                <p className="eyebrow">Step 01 / Category & Context</p>
                <h2>Describe your creative submission</h2>
              </div>
            </div>

            {/* Title */}
            <label htmlFor="sub-title">Submission Title *</label>
            <input
              id="sub-title"
              type="text"
              placeholder="e.g. Echoes of the Quad, Monsoon Sketches, Sunset Fingerstyle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            {/* Category Selector */}
            <label htmlFor="sub-category">Creative Category *</label>
            <select
              id="sub-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CREATIVE_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label} — {c.hint}
                </option>
              ))}
            </select>

            {/* Description */}
            <label htmlFor="sub-description">
              Artistic Description & Creative Intent
            </label>
            <textarea
              id="sub-description"
              rows={4}
              placeholder="What were you exploring? What techniques, influences, or story does this piece hold? What feedback are you hoping for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            {/* Experience & Confidence */}
            <div className="form-two-col">
              <div>
                <label htmlFor="sub-exp">Experience Level</label>
                <select
                  id="sub-exp"
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                >
                  <option value="beginner">Beginner (First few attempts)</option>
                  <option value="intermediate">Intermediate (Practicing consistently)</option>
                  <option value="advanced">Advanced (Experienced creator / performer)</option>
                </select>
              </div>

              <div>
                <label htmlFor="sub-confidence">Confidence & Comfort Level</label>
                <select
                  id="sub-confidence"
                  value={confidenceLevel}
                  onChange={(e) => setConfidenceLevel(e.target.value)}
                >
                  <option value="exploring">Just exploring / Curious</option>
                  <option value="building">Building confidence</option>
                  <option value="collaborating">Ready to collaborate</option>
                  <option value="performing">Stage-ready / Performing</option>
                </select>
              </div>
            </div>

            {/* Visibility Settings */}
            <label htmlFor="sub-visibility">Visibility Control</label>
            <select
              id="sub-visibility"
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
            >
              <option value="campus">Campus Showcase (Visible to SVM students & faculty)</option>
              <option value="public">Public Portfolio (Featured on CultureLoop)</option>
              <option value="private">Private (Only you and the AI evaluator)</option>
            </select>

            {/* AI Consent Checkbox */}
            <label className="consent-row">
              <input
                type="checkbox"
                checked={aiConsent}
                onChange={(e) => setAiConsent(e.target.checked)}
              />
              <span>
                I consent to an individualized AI evaluation by Google Gemini to analyze this piece and provide constructive creative feedback.
              </span>
            </label>

            {/* Submit Action */}
            <button
              className="button button-primary full-width"
              type="submit"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Icon name="refresh" size={17} className="spin" /> {evaluatingStep || 'Processing...'}
                </>
              ) : (
                <>
                  Submit Work & Discover Talent <Icon name="arrow" size={16} />
                </>
              )}
            </button>
          </section>

          {/* Right Column: File Dropzone & Live Preview */}
          <section className="app-panel upload-panel">
            <div className="section-title-row">
              <div>
                <p className="eyebrow">Step 02 / Creative Media</p>
                <h2>Upload your work</h2>
              </div>
            </div>

            {fileError && (
              <div className="alert-banner alert-error inline">
                <Icon name="alert" size={16} />
                <p>{fileError}</p>
              </div>
            )}

            <label className="upload-zone">
              <input
                type="file"
                accept="image/*,audio/*,video/*,application/pdf,text/plain,.md"
                onChange={handleFileChange}
              />
              <Icon name="upload" size={36} />
              <strong>{selectedFile ? selectedFile.name : 'Drag & drop or browse media file'}</strong>
              <span>
                {selectedFile
                  ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB · ${selectedFile.type || 'Custom file'}`
                  : 'Supports Images, Audio (MP3/WAV), Video (MP4), PDF, or Text up to 25 MB'}
              </span>
              {selectedFile && (
                <span className="file-ready-tag">
                  <Icon name="check" size={13} /> Ready for multimodal upload
                </span>
              )}
            </label>

            {/* Live Preview of Selected File */}
            {selectedFile && (
              <div className="upload-preview-card">
                <div className="preview-top">
                  <span>Selected file preview</span>
                  <button
                    type="button"
                    className="text-link danger"
                    onClick={() => {
                      setSelectedFile(null);
                      setFileBase64(null);
                      setFilePreviewUrl(null);
                    }}
                  >
                    Remove
                  </button>
                </div>
                <MediaViewer
                  fileUrl={filePreviewUrl}
                  fileType={selectedFile.type}
                  fileName={selectedFile.name}
                  title={title || 'Upload Preview'}
                />
              </div>
            )}

            <div className="eval-info-notice">
              <Icon name="spark" size={18} />
              <div>
                <strong>How Gemini evaluates your work:</strong>
                <p>
                  Actual media bytes are securely sent to Google Gemini server-side. The model assesses technical execution, rhythm, composition, and emotional resonance using category-specific criteria without storing your media externally.
                </p>
              </div>
            </div>
          </section>
        </form>
      )}

      {/* CAMPUS SHOWCASE FEED TAB */}
      {activeTab === 'feed' && (
        <section className="showcase-feed-section">
          {/* Feed Filter Toolbar */}
          <div className="feed-filter-bar">
            <span className="filter-label">Filter by discipline:</span>
            <div className="category-scroll-chips">
              <button
                className={filterCategory === 'all' ? 'chip selected' : 'chip'}
                onClick={() => setFilterCategory('all')}
              >
                All Categories
              </button>
              {CREATIVE_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  className={filterCategory === cat.id ? 'chip selected' : 'chip'}
                  onClick={() => setFilterCategory(cat.id)}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {loadingFeed ? (
            <div className="loading-state">
              <Icon name="refresh" size={24} className="spin" />
              <p>Loading campus creative showcase...</p>
            </div>
          ) : submissions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <Icon name="spark" size={24} />
              </div>
              <p>No submissions found in this category yet</p>
              <span>Be the first student to share your creative work!</span>
              <button
                className="button button-primary"
                onClick={() => setActiveTab('submit')}
              >
                Upload your work <Icon name="upload" size={16} />
              </button>
            </div>
          ) : (
            <div className="showcase-card-grid">
              {submissions.map((sub) => (
                <article className="submission-card" key={sub.id}>
                  <div className="sub-card-media">
                    <MediaViewer
                      fileUrl={sub.file_url}
                      fileType={sub.file_type}
                      fileName={sub.file_name}
                      title={sub.title}
                    />
                    <span className="sub-category-tag">{sub.category}</span>
                  </div>

                  <div className="sub-card-body">
                    <div className="sub-author-row">
                      <span className="author-name">{sub.author_name || 'SVM Creator'}</span>
                      <span className="sub-date">{sub.created_at?.slice(0, 10)}</span>
                    </div>

                    <h3>{sub.title}</h3>
                    <p className="sub-desc">{sub.description || 'No description provided.'}</p>

                    {/* AI Score Badge if present */}
                    {sub.evaluation && (
                      <div className="sub-ai-summary">
                        <div className="ai-badge-row">
                          <span className="badge-pill">
                            <Icon name="spark" size={12} /> AI Evaluated
                          </span>
                          {sub.evaluation.overall_score && (
                            <strong className="badge-score">
                              {sub.evaluation.overall_score.toFixed(1)} / 10
                            </strong>
                          )}
                        </div>
                        {sub.evaluation.summary && (
                          <p className="ai-summary-snippet">"{sub.evaluation.summary}"</p>
                        )}
                      </div>
                    )}

                    <div className="sub-card-footer">
                      <span className="experience-tag">{sub.experience_level}</span>
                      <button
                        className="text-link"
                        onClick={() => {
                          setSubmitSuccess({ submission: sub, evaluation: sub.evaluation });
                          setActiveTab('submit');
                        }}
                      >
                        View feedback details <Icon name="arrow" size={14} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

