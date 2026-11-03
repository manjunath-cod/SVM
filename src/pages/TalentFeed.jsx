import { api } from '../services/api.js';
import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Icon } from '../components/Icons.jsx';
import { Modal } from '../components/Modal.jsx';
import { Toast } from '../components/Toast.jsx';
import { CATEGORY_FILTERS, CREATIVE_CATEGORIES, INITIAL_CREATORS, INITIAL_POSTS } from '../data/talentFeed.js';

function Avatar({ creator, size = 'medium' }) {
  return (
    <span
      className={`talent-avatar talent-avatar-${size}`}
      style={{ background: creator.color || '#7652F5' }}
      aria-hidden="true"
    >
      {creator.initials || 'CR'}
    </span>
  );
}

function CreatePost({ currentUser, userBadges, userBadgeCount, onPost, onNotify }) {
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [category, setCategory] = useState('singing');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef(null);

  const creator = {
    name: currentUser?.name || 'Your creative profile',
    initials: (currentUser?.name || 'You').split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase(),
    color: '#7652F5',
    badges: userBadges || [],
    badgeCount: userBadgeCount || 0
  };

  const handleFile = (event) => {
    const nextFile = event.target.files?.[0];
    if (!nextFile) return;
    if (!nextFile.type.startsWith('image/') && !nextFile.type.startsWith('video/')) {
      setError('Please choose an image or video file.');
      return;
    }
    if (nextFile.size > 25 * 1024 * 1024) {
      setError('Files must be 25 MB or smaller.');
      return;
    }
    setError('');
    setFile(nextFile);
    setPreview(URL.createObjectURL(nextFile));
  };

  const publish = async (event) => {
    event.preventDefault();
    if (!caption.trim() && !file) {
      setError('Add a description or media before posting.');
      return;
    }

    setSubmitting(true);
    setError('');

    let fileBase64 = null;
    if (file) {
      try {
        fileBase64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(file);
        });
      } catch {
        fileBase64 = null;
      }
    }

    const tags = hashtags
      .split(/[,\s]+/)
      .filter(Boolean)
      .map((tag) => (tag.startsWith('#') ? tag : `#${tag}`));

    try {
      const res = await api.createTalentPost({
        caption: caption.trim() || 'A new creative moment.',
        hashtags: tags,
        category,
        mediaType: file?.type.startsWith('video/') ? 'video' : 'image',
        fileBase64,
        fileName: file?.name,
        preview
      });

      if (res?.post) {
        onPost(res.post);
      } else {
        throw new Error('No post returned');
      }
    } catch {
      // Graceful optimistic fallback
      onPost({
        id: `post-${Date.now()}`,
        creator,
        timestamp: 'Just now',
        category,
        mediaType: file?.type.startsWith('video/') ? 'video' : 'image',
        media: preview ? [preview] : [],
        caption: caption.trim() || 'A new creative moment.',
        hashtags: tags,
        likes: 0,
        comments: [],
        saves: 0
      });
    } finally {
      setSubmitting(false);
      setCaption('');
      setHashtags('');
      setFile(null);
      setPreview(null);
      if (inputRef.current) inputRef.current.value = '';
      onNotify({
        type: 'success',
        title: 'Post shared',
        message: 'Your creative work is now published on the SVM Talent Feed.'
      });
    }
  };

  return (
    <form className="talent-create-card" onSubmit={publish}>
      <div className="talent-create-top">
        <Avatar creator={creator} />
        <textarea
          value={caption}
          onChange={(event) => setCaption(event.target.value)}
          placeholder="What are you creating today?"
          aria-label="Post description"
          rows={2}
          disabled={submitting}
        />
      </div>

      {preview && (
        <div className="talent-upload-preview">
          {file?.type.startsWith('video/') ? (
            <video src={preview} controls />
          ) : (
            <img src={preview} alt="Selected post preview" />
          )}
          <button
            type="button"
            className="talent-preview-remove"
            onClick={() => {
              setFile(null);
              setPreview(null);
            }}
          >
            Remove preview
          </button>
        </div>
      )}

      {error && <p className="talent-form-error" role="alert">{error}</p>}

      <div className="talent-create-options">
        <label className="talent-upload-button">
          <Icon name="images" size={16} /> Photo
          <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} disabled={submitting} />
        </label>
        <label className="talent-upload-button">
          <Icon name="video" size={16} /> Video
          <input type="file" accept="video/*" onChange={handleFile} disabled={submitting} />
        </label>
        <label className="talent-upload-button">
          <Icon name="palette" size={16} /> Artwork
          <input type="file" accept="image/*" onChange={handleFile} disabled={submitting} />
        </label>

        <select
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          aria-label="Creative category"
          disabled={submitting}
        >
          {CREATIVE_CATEGORIES.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>

        <button className="button button-primary btn-sm talent-post-button" type="submit" disabled={submitting}>
          <Icon name="plus" size={15} /> {submitting ? 'Sharing...' : 'Post'}
        </button>
      </div>

      <input
        className="talent-hashtag-input"
        value={hashtags}
        onChange={(event) => setHashtags(event.target.value)}
        placeholder="Add hashtags (separate with spaces)"
        aria-label="Add hashtags"
        disabled={submitting}
      />
      <p className="talent-upload-note">Verified SVM Creative Hub: creations are saved, cataloged, and eligible for official badges.</p>
    </form>
  );
}

function PostActions({ post, liked, saved, onLike, onComment, onSave, onShare }) {
  return (
    <div className="talent-actions">
      <button
        className={liked ? 'talent-action liked' : 'talent-action'}
        onClick={onLike}
        aria-label={liked ? 'Unlike post' : 'Like post'}
      >
        <Icon name={liked ? 'heartFilled' : 'heart'} size={19} />
        <span>{(post.likes || 0) + (liked && !post.isLiked ? 1 : 0)}</span>
      </button>

      <button className="talent-action" onClick={onComment} aria-label="View comments">
        <Icon name="messageCircle" size={19} />
        <span>{post.comments?.length || 0}</span>
      </button>

      <button
        className={saved ? 'talent-action saved' : 'talent-action'}
        onClick={onSave}
        aria-label={saved ? 'Remove saved post' : 'Save post'}
      >
        <Icon name={saved ? 'bookmarkFilled' : 'bookmark'} size={19} />
      </button>

      <button className="talent-action talent-share-action" onClick={onShare} aria-label="Share post">
        <Icon name="share" size={19} />
      </button>
    </div>
  );
}

function PostCard({ post, liked, saved, onLike, onComment, onSave, onShare, onFollow, following, onImage }) {
  const categoryLabel = CREATIVE_CATEGORIES.find((item) => item.id === post.category)?.label || 'Creative Skills';
  return (
    <article className="talent-post-card" id={`post-${post.id}`}>
      <header className="talent-post-header">
        <Avatar creator={post.creator} />
        <div className="talent-header-info">
          <div className="talent-author-row">
            <strong>{post.creator.name}</strong>
            {post.creator.badges && post.creator.badges.length > 0 && (
              <div className="talent-badge-chips" title="Verified SVM Achievements">
                {post.creator.badges.slice(0, 2).map((b) => (
                  <img
                    key={b.id || b.name}
                    src={b.image}
                    alt={b.name}
                    className="talent-badge-crest"
                    title={`${b.name} · Verified SVM Achievement`}
                  />
                ))}
              </div>
            )}
            {post.creator.badgeCount ? (
              <span className="talent-badge-count-pill" title="Verified SVM Milestones">
                <Icon name="badge" size={11} /> {post.creator.badgeCount}
              </span>
            ) : null}
          </div>
          <span>{categoryLabel} · {post.timestamp}</span>
        </div>
        <button className="talent-follow-inline" onClick={() => onFollow(post.creator.name)}>
          {following ? 'Following' : 'Follow'}
        </button>
      </header>

      {post.media && post.media.length > 0 && (
        <div className={`talent-media talent-media-${post.mediaType}`}>
          {post.mediaType === 'video' ? (
            <video src={post.media[0]} controls preload="metadata" poster={post.media[0]} aria-label={`Video by ${post.creator.name}`} />
          ) : (
            <div className="talent-gallery">
              {post.media.map((image, index) => (
                <button key={image + index} type="button" onClick={() => onImage(image)}>
                  <img src={image} alt={`${post.creator.name}'s creative work ${index + 1}`} loading="lazy" />
                </button>
              ))}
            </div>
          )}
          {post.mediaType === 'video' && <span className="talent-media-badge"><Icon name="play" size={12} /> Video</span>}
        </div>
      )}

      <div className="talent-post-body">
        <p>{post.caption}</p>
        <div className="talent-hashtags">
          {(post.hashtags || []).map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
      </div>

      <PostActions
        post={post}
        liked={liked}
        saved={saved}
        onLike={onLike}
        onComment={onComment}
        onSave={onSave}
        onShare={onShare}
      />

      <button className="talent-profile-link" onClick={() => onFollow(post.creator.name)}>
        View {post.creator.name}'s profile <Icon name="arrow" size={14} />
      </button>
    </article>
  );
}

function CommentsModal({ post, onClose, onAdd }) {
  const [comment, setComment] = useState('');
  const [posting, setPosting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (comment.trim()) {
      setPosting(true);
      await onAdd(comment.trim());
      setComment('');
      setPosting(false);
    }
  };

  return (
    <Modal isOpen title="Comments" eyebrow={post.creator.name} onClose={onClose}>
      <div className="talent-comments">
        {post.comments && post.comments.length ? (
          post.comments.map((item) => (
            <div className="talent-comment" key={item.id}>
              <Avatar creator={{ ...item, color: '#7652F5' }} size="small" />
              <div>
                <strong>{item.name}</strong>
                <p>{item.text}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="muted">Be the first to encourage this creator.</p>
        )}
      </div>
      <form className="talent-comment-form" onSubmit={handleSubmit}>
        <input
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder="Add an encouraging comment..."
          aria-label="Add comment"
          disabled={posting}
        />
        <button className="button button-primary btn-sm" disabled={posting}>
          {posting ? 'Posting...' : 'Post'}
        </button>
      </form>
    </Modal>
  );
}

function CreatorCard({ creator, following, onFollow }) {
  return (
    <div className="creator-card">
      <Avatar creator={creator} />
      <div className="creator-info">
        <div className="creator-title-row">
          <strong>{creator.name}</strong>
          {creator.badges && creator.badges.length > 0 && (
            <img
              src={creator.badges[0].image}
              alt={creator.badges[0].name}
              className="creator-badge-crest"
              title={`${creator.badges[0].name} · Verified Achievement`}
            />
          )}
        </div>
        <span>{creator.category}</span>
        <p>{creator.bio}</p>
      </div>
      <button
        className={following ? 'button button-light btn-sm' : 'button button-primary btn-sm'}
        onClick={() => onFollow(creator.name)}
      >
        {following ? 'Following' : 'Follow'}
      </button>
    </div>
  );
}

export function TalentFeed({ currentUser }) {
  const [posts, setPosts] = useState(INITIAL_POSTS);
  const [creators, setCreators] = useState(INITIAL_CREATORS);
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('latest');
  const [liked, setLiked] = useState({});
  const [saved, setSaved] = useState({});
  const [following, setFollowing] = useState({});
  const [commentsFor, setCommentsFor] = useState(null);
  const [imageFor, setImageFor] = useState(null);
  const [toast, setToast] = useState(null);
  const [currentUserBadges, setCurrentUserBadges] = useState([]);
  const [currentUserBadgeCount, setCurrentUserBadgeCount] = useState(0);

  // Load verified achievements for current user
  useEffect(() => {
    api.getAchievements()
      .then((data) => {
        const featured = (data.badges || []).filter((b) => b.unlocked && b.featured);
        setCurrentUserBadges(featured);
        setCurrentUserBadgeCount(data.summary?.badgesEarned || 0);
      })
      .catch(() => {});
  }, []);

  // Load talent feed posts from server
  useEffect(() => {
    loadFeed();
  }, [filter, sort]);

  // Load creators and popular posts
  useEffect(() => {
    api.getTalentCreators()
      .then((data) => {
        if (data?.creators && data.creators.length > 0) {
          setCreators(data.creators);
        }
      })
      .catch(() => {});
  }, []);

  const loadFeed = async () => {
    try {
      const data = await api.getTalentFeed({ category: filter, sort });
      if (data?.posts && data.posts.length > 0) {
        setPosts(data.posts);
        const lMap = {};
        const sMap = {};
        const fMap = {};
        data.posts.forEach((p) => {
          if (p.isLiked) lMap[p.id] = true;
          if (p.isSaved) sMap[p.id] = true;
          if (p.isFollowing) fMap[p.creator.name] = true;
        });
        setLiked((prev) => ({ ...prev, ...lMap }));
        setSaved((prev) => ({ ...prev, ...sMap }));
        setFollowing((prev) => ({ ...prev, ...fMap }));
      }
    } catch {
      // Keep initial posts
    }
  };

  const visiblePosts = useMemo(
    () =>
      posts
        .filter((post) => {
          const matchesFilter =
            filter === 'all' || filter === 'trending'
              ? filter !== 'trending' || post.trending
              : post.category === filter;
          const haystack = `${post.creator.name} ${post.caption} ${(post.hashtags || []).join(' ')}`.toLowerCase();
          return matchesFilter && haystack.includes(query.toLowerCase());
        })
        .sort((a, b) =>
          sort === 'liked'
            ? b.likes - a.likes
            : sort === 'discussed'
            ? (b.comments?.length || 0) - (a.comments?.length || 0)
            : 0
        ),
    [posts, filter, query, sort]
  );

  const follow = async (name) => {
    const nextState = !following[name];
    setFollowing((state) => ({ ...state, [name]: nextState }));
    try {
      await api.followCreator(name);
    } catch {
      // optimistic keep
    }
  };

  const handleLike = async (postId) => {
    const isNowLiked = !liked[postId];
    setLiked((state) => ({ ...state, [postId]: isNowLiked }));
    setPosts((items) =>
      items.map((post) =>
        post.id === postId ? { ...post, likes: Math.max(0, (post.likes || 0) + (isNowLiked ? 1 : -1)) } : post
      )
    );
    try {
      const res = await api.likeTalentPost(postId);
      if (res?.likes !== undefined) {
        setPosts((items) =>
          items.map((post) => (post.id === postId ? { ...post, likes: res.likes } : post))
        );
      }
    } catch {
      // optimistic keep
    }
  };

  const handleSave = async (postId) => {
    const isNowSaved = !saved[postId];
    setSaved((state) => ({ ...state, [postId]: isNowSaved }));
    setToast({
      type: 'success',
      title: isNowSaved ? 'Post saved' : 'Removed from saved',
      message: isNowSaved ? 'Saved to your portfolio bookmark list.' : 'Removed from your saved creations.'
    });
    try {
      await api.saveTalentPost(postId);
    } catch {
      // optimistic keep
    }
  };

  const share = async (post) => {
    const link = `${window.location.origin}${window.location.pathname}#talent-feed-${post.id}`;
    if (navigator.share) {
      await navigator.share({ title: `${post.creator.name}'s Talent Feed post`, url: link });
    } else {
      await navigator.clipboard?.writeText(link);
      setToast({ type: 'success', title: 'Link copied', message: 'The post link is ready to share.' });
    }
  };

  const addComment = async (postId, text) => {
    const tempId = `comm-${Date.now()}`;
    const authorName = currentUser?.name || 'You';
    const authorInitials = authorName.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
    const newComment = { id: tempId, name: authorName, initials: authorInitials, text };

    setPosts((items) =>
      items.map((post) => (post.id === postId ? { ...post, comments: [...(post.comments || []), newComment] } : post))
    );

    try {
      const res = await api.commentTalentPost(postId, text);
      if (res?.comment) {
        setPosts((items) =>
          items.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  comments: (post.comments || []).map((c) => (c.id === tempId ? res.comment : c))
                }
              : post
          )
        );
      }
    } catch {
      // optimistic keep
    }
  };

  return (
    <div className="talent-feed-page">
      <Toast toast={toast} onClose={() => setToast(null)} />
      <div className="talent-page-heading">
        <div>
          <p className="eyebrow">Student Talent Community</p>
          <h1>Every talent deserves a <em>stage.</em></h1>
          <p className="page-copy">Discover creativity, celebrate student talent and share what you love creating.</p>
        </div>
        <div className="talent-demo-badge">
          <Icon name="spark" size={18} />
          <span>SVM Campus Creative Network</span>
        </div>
      </div>

      <div className="talent-layout">
        <main className="talent-main-column">
          <CreatePost
            currentUser={currentUser}
            userBadges={currentUserBadges}
            userBadgeCount={currentUserBadgeCount}
            onPost={(post) => setPosts((items) => [post, ...items])}
            onNotify={setToast}
          />

          <div className="talent-section-heading">
            <div>
              <p className="eyebrow">Your creative circle</p>
              <h2>Watch Talents</h2>
              <p>Discover what your fellow students are creating.</p>
            </div>
          </div>

          <div className="talent-toolbar">
            <div className="talent-search">
              <Icon name="search" size={17} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search creators, captions or hashtags"
                aria-label="Search talent feed"
              />
            </div>
            <select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort posts">
              <option value="latest">Latest</option>
              <option value="liked">Most Liked</option>
              <option value="discussed">Most Discussed</option>
            </select>
          </div>

          <div className="talent-filters" role="tablist" aria-label="Talent categories">
            {CATEGORY_FILTERS.map((item) => (
              <button
                key={item.id}
                className={filter === item.id ? 'active' : ''}
                onClick={() => setFilter(item.id)}
                role="tab"
                aria-selected={filter === item.id}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="talent-post-list">
            {visiblePosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                liked={liked[post.id]}
                saved={saved[post.id]}
                following={following[post.creator.name]}
                onLike={() => handleLike(post.id)}
                onComment={() => setCommentsFor(post.id)}
                onSave={() => handleSave(post.id)}
                onShare={() => share(post)}
                onFollow={follow}
                onImage={setImageFor}
              />
            ))}
          </div>

          {!visiblePosts.length && (
            <div className="talent-empty-state">
              <Icon name="images" size={30} />
              <h3>No talents found</h3>
              <p>Try a different search or category. New creative work will appear here.</p>
              <button
                className="button button-light btn-sm"
                onClick={() => {
                  setFilter('all');
                  setQuery('');
                }}
              >
                Clear filters
              </button>
            </div>
          )}
        </main>

        <aside className="talent-side-column">
          <section className="talent-side-card">
            <div className="talent-side-title">
              <div>
                <p className="eyebrow">Meet the community</p>
                <h3>Creative Stars</h3>
              </div>
              <Icon name="spark" size={20} />
            </div>
            {creators.map((creator) => (
              <CreatorCard
                key={creator.name}
                creator={creator}
                following={following[creator.name]}
                onFollow={follow}
              />
            ))}
          </section>

          <section className="talent-side-card popular-card">
            <div className="talent-side-title">
              <div>
                <p className="eyebrow">Community pulse</p>
                <h3>Popular This Week</h3>
              </div>
              <Icon name="flame" size={20} />
            </div>
            <p>Most loved by the SVM community.</p>
            {posts
              .slice()
              .sort((a, b) => (b.likes || 0) - (a.likes || 0))
              .slice(0, 3)
              .map((post, index) => (
                <button
                  className="popular-post"
                  key={post.id}
                  onClick={() => document.getElementById(`post-${post.id}`)?.scrollIntoView({ behavior: 'smooth' })}
                >
                  <span>0{index + 1}</span>
                  <strong>
                    {post.creator.name}
                    <small>{post.likes || 0} likes · {post.category}</small>
                  </strong>
                  <Icon name="arrow" size={14} />
                </button>
              ))}
          </section>
        </aside>
      </div>

      {commentsFor && (
        <CommentsModal
          post={posts.find((post) => post.id === commentsFor) || { creator: { name: 'Creator' }, comments: [] }}
          onClose={() => setCommentsFor(null)}
          onAdd={(text) => addComment(commentsFor, text)}
        />
      )}

      <Modal isOpen={Boolean(imageFor)} title="Creative work" onClose={() => setImageFor(null)} maxWidth={800}>
        {imageFor && <img className="talent-modal-image" src={imageFor} alt="Enlarged creative work" />}
      </Modal>
    </div>
  );
}
