import { api } from '../services/api.js';
import React, { useMemo, useRef, useState } from 'react';
import { Icon } from '../components/Icons.jsx';
import { Modal } from '../components/Modal.jsx';
import { Toast } from '../components/Toast.jsx';
import { CATEGORY_FILTERS, CREATIVE_CATEGORIES, INITIAL_CREATORS, INITIAL_POSTS } from '../data/talentFeed.js';

function Avatar({ creator, size = 'medium' }) {
  return <span className={`talent-avatar talent-avatar-${size}`} style={{ background: creator.color }} aria-hidden="true">{creator.initials}</span>;
}

function CreatePost({ currentUser, userBadges, userBadgeCount, onPost, onNotify }) {
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [category, setCategory] = useState('singing');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const inputRef = useRef(null);
  const creator = { name: currentUser?.name || 'Your creative profile', initials: (currentUser?.name || 'You').split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase(), color: '#7652F5', badges: userBadges || [], badgeCount: userBadgeCount || 0 };

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

  const publish = (event) => {
    event.preventDefault();
    if (!caption.trim() && !file) {
      setError('Add a description or media before posting.');
      return;
    }
    onPost({
      id: `post-${Date.now()}`,
      creator,
      timestamp: 'Just now',
      category,
      mediaType: file?.type.startsWith('video/') ? 'video' : 'image',
      media: preview ? [preview] : [],
      caption: caption.trim() || 'A new creative moment.',
      hashtags: hashtags.split(/[,\s]+/).filter(Boolean).map((tag) => tag.startsWith('#') ? tag : `#${tag}`),
      likes: 0,
      comments: [],
      saves: 0
    });
    setCaption('');
    setHashtags('');
    setFile(null);
    setPreview(null);
    setError('');
    if (inputRef.current) inputRef.current.value = '';
    onNotify({ type: 'success', title: 'Post shared', message: 'Your post is now part of the Talent Feed.' });
  };

  return (
    <form className="talent-create-card" onSubmit={publish}>
      <div className="talent-create-top">
        <Avatar creator={creator} />
        <textarea value={caption} onChange={(event) => setCaption(event.target.value)} placeholder="What are you creating today?" aria-label="Post description" rows={2} />
      </div>
      {preview && <div className="talent-upload-preview">{file.type.startsWith('video/') ? <video src={preview} controls /> : <img src={preview} alt="Selected post preview" />}<button type="button" className="talent-preview-remove" onClick={() => { setFile(null); setPreview(null); }}>Remove preview</button></div>}
      {error && <p className="talent-form-error" role="alert">{error}</p>}
      <div className="talent-create-options">
        <label className="talent-upload-button"><Icon name="images" size={16} /> Photo<input ref={inputRef} type="file" accept="image/*" onChange={handleFile} /></label>
        <label className="talent-upload-button"><Icon name="video" size={16} /> Video<input type="file" accept="video/*" onChange={handleFile} /></label>
        <label className="talent-upload-button"><Icon name="palette" size={16} /> Artwork<input type="file" accept="image/*" onChange={handleFile} /></label>
        <select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Creative category">
          {CREATIVE_CATEGORIES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
        <button className="button button-primary btn-sm talent-post-button" type="submit"><Icon name="plus" size={15} /> Post</button>
      </div>
      <input className="talent-hashtag-input" value={hashtags} onChange={(event) => setHashtags(event.target.value)} placeholder="Add hashtags (separate with spaces)" aria-label="Add hashtags" />
      <p className="talent-upload-note">Demo mode: posts are stored in this session until a connected backend is available.</p>
    </form>
  );
}

function PostActions({ post, liked, saved, onLike, onComment, onSave, onShare }) {
  return <div className="talent-actions">
    <button className={liked ? 'talent-action liked' : 'talent-action'} onClick={onLike} aria-label={liked ? 'Unlike post' : 'Like post'}><Icon name={liked ? 'heartFilled' : 'heart'} size={19} /><span>{post.likes + (liked ? 1 : 0)}</span></button>
    <button className="talent-action" onClick={onComment} aria-label="View comments"><Icon name="messageCircle" size={19} /><span>{post.comments.length}</span></button>
    <button className={saved ? 'talent-action saved' : 'talent-action'} onClick={onSave} aria-label={saved ? 'Remove saved post' : 'Save post'}><Icon name={saved ? 'bookmarkFilled' : 'bookmark'} size={19} /></button>
    <button className="talent-action talent-share-action" onClick={onShare} aria-label="Share post"><Icon name="share" size={19} /></button>
  </div>;
}

function PostCard({ post, liked, saved, onLike, onComment, onSave, onShare, onFollow, following, onImage }) {
  const categoryLabel = CREATIVE_CATEGORIES.find((item) => item.id === post.category)?.label || 'Creative Skills';
  return <article className="talent-post-card" id={`post-${post.id}`}>
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
      <button className="talent-follow-inline" onClick={() => onFollow(post.creator.name)}>{following ? 'Following' : 'Follow'}</button>
    </header>
    {post.media.length > 0 && <div className={`talent-media talent-media-${post.mediaType}`}>
      {post.mediaType === 'video' ? <video src={post.media[0]} controls preload="metadata" poster={post.media[0]} aria-label={`Video by ${post.creator.name}`} /> : <div className="talent-gallery">{post.media.map((image, index) => <button key={image} type="button" onClick={() => onImage(image)}><img src={image} alt={`${post.creator.name}'s creative work ${index + 1}`} loading="lazy" /></button>)}</div>}
      {post.mediaType === 'video' && <span className="talent-media-badge"><Icon name="play" size={12} /> Video</span>}
    </div>}
    <div className="talent-post-body"><p>{post.caption}</p><div className="talent-hashtags">{post.hashtags.map((tag) => <span key={tag}>{tag}</span>)}</div></div>
    <PostActions post={post} liked={liked} saved={saved} onLike={onLike} onComment={onComment} onSave={onSave} onShare={onShare} />
    <button className="talent-profile-link" onClick={() => onFollow(post.creator.name)}>View {post.creator.name}'s profile <Icon name="arrow" size={14} /></button>
  </article>;
}

function CommentsModal({ post, onClose, onAdd }) {
  const [comment, setComment] = useState('');
  return <Modal isOpen title="Comments" eyebrow={post.creator.name} onClose={onClose}>
    <div className="talent-comments">{post.comments.length ? post.comments.map((item) => <div className="talent-comment" key={item.id}><Avatar creator={{ ...item, color: '#7652F5' }} size="small" /><div><strong>{item.name}</strong><p>{item.text}</p></div></div>) : <p className="muted">Be the first to encourage this creator.</p>}</div>
    <form className="talent-comment-form" onSubmit={(event) => { event.preventDefault(); if (comment.trim()) { onAdd(comment.trim()); setComment(''); } }}><input value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Add an encouraging comment..." aria-label="Add comment" /><button className="button button-primary btn-sm">Post</button></form>
  </Modal>;
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
      <button className={following ? 'button button-light btn-sm' : 'button button-primary btn-sm'} onClick={() => onFollow(creator.name)}>{following ? 'Following' : 'Follow'}</button>
    </div>
  );
}

export function TalentFeed({ currentUser }) {
  const [posts, setPosts] = useState(INITIAL_POSTS);
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

  React.useEffect(() => {
    api.getAchievements().then((data) => {
      const featured = (data.badges || []).filter((b) => b.unlocked && b.featured);
      setCurrentUserBadges(featured);
      setCurrentUserBadgeCount(data.summary?.badgesEarned || 0);
    }).catch(() => {});
  }, []);

  const visiblePosts = useMemo(() => posts.filter((post) => {
    const matchesFilter = filter === 'all' || filter === 'trending' ? filter !== 'trending' || post.trending : post.category === filter;
    const haystack = `${post.creator.name} ${post.caption} ${post.hashtags.join(' ')}`.toLowerCase();
    return matchesFilter && haystack.includes(query.toLowerCase());
  }).sort((a, b) => sort === 'liked' ? b.likes - a.likes : sort === 'discussed' ? b.comments.length - a.comments.length : 0), [posts, filter, query, sort]);

  const follow = (name) => setFollowing((state) => ({ ...state, [name]: !state[name] }));
  const share = async (post) => {
    const link = `${window.location.origin}${window.location.pathname}#talent-feed-${post.id}`;
    if (navigator.share) await navigator.share({ title: `${post.creator.name}'s Talent Feed post`, url: link });
    else { await navigator.clipboard?.writeText(link); setToast({ type: 'success', title: 'Link copied', message: 'The post link is ready to share.' }); }
  };
  const addComment = (postId, text) => setPosts((items) => items.map((post) => post.id === postId ? { ...post, comments: [...post.comments, { id: `comment-${Date.now()}`, name: currentUser?.name || 'You', initials: 'YO', text }] } : post));

  return <div className="talent-feed-page">
    <Toast toast={toast} onClose={() => setToast(null)} />
    <div className="talent-page-heading"><div><p className="eyebrow">Student Talent Community</p><h1>Every talent deserves a <em>stage.</em></h1><p className="page-copy">Discover creativity, celebrate student talent and share what you love creating.</p></div><div className="talent-demo-badge"><Icon name="images" size={18} /><span>Illustrative demo profiles</span></div></div>
    <div className="talent-layout">
      <main className="talent-main-column">
        <CreatePost currentUser={currentUser} userBadges={currentUserBadges} userBadgeCount={currentUserBadgeCount} onPost={(post) => setPosts((items) => [post, ...items])} onNotify={setToast} />
        <div className="talent-section-heading"><div><p className="eyebrow">Your creative circle</p><h2>Watch Talents</h2><p>Discover what your fellow students are creating.</p></div></div>
        <div className="talent-toolbar"><div className="talent-search"><Icon name="search" size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search creators, captions or hashtags" aria-label="Search talent feed" /></div><select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort posts"><option value="latest">Latest</option><option value="liked">Most Liked</option><option value="discussed">Most Discussed</option></select></div>
        <div className="talent-filters" role="tablist" aria-label="Talent categories">{CATEGORY_FILTERS.map((item) => <button key={item.id} className={filter === item.id ? 'active' : ''} onClick={() => setFilter(item.id)} role="tab" aria-selected={filter === item.id}>{item.label}</button>)}</div>
        <div className="talent-post-list">{visiblePosts.map((post) => <PostCard key={post.id} post={post} liked={liked[post.id]} saved={saved[post.id]} following={following[post.creator.name]} onLike={() => setLiked((state) => ({ ...state, [post.id]: !state[post.id] }))} onComment={() => setCommentsFor(post.id)} onSave={() => { setSaved((state) => ({ ...state, [post.id]: !state[post.id] })); setToast({ type: 'success', title: saved[post.id] ? 'Removed from saved' : 'Post saved', message: 'Saved posts are available in this session.' }); }} onShare={() => share(post)} onFollow={follow} onImage={setImageFor} />)}</div>
        {!visiblePosts.length && <div className="talent-empty-state"><Icon name="images" size={30} /><h3>No talents found</h3><p>Try a different search or category. New creative work will appear here.</p><button className="button button-light btn-sm" onClick={() => { setFilter('all'); setQuery(''); }}>Clear filters</button></div>}
      </main>
      <aside className="talent-side-column"><section className="talent-side-card"><div className="talent-side-title"><div><p className="eyebrow">Meet the community</p><h3>Creative Stars</h3></div><Icon name="spark" size={20} /></div>{INITIAL_CREATORS.map((creator) => <CreatorCard key={creator.name} creator={creator} following={following[creator.name]} onFollow={follow} />)}</section><section className="talent-side-card popular-card"><div className="talent-side-title"><div><p className="eyebrow">Community pulse</p><h3>Popular This Week</h3></div><Icon name="flame" size={20} /></div><p>Most loved by the CultureLoop community.</p>{posts.slice().sort((a, b) => b.likes - a.likes).slice(0, 3).map((post, index) => <button className="popular-post" key={post.id} onClick={() => document.getElementById(`post-${post.id}`)?.scrollIntoView()}><span>0{index + 1}</span><strong>{post.creator.name}<small>{post.likes} likes · {post.category}</small></strong><Icon name="arrow" size={14} /></button>)}</section></aside>
    </div>
    {commentsFor && <CommentsModal post={posts.find((post) => post.id === commentsFor)} onClose={() => setCommentsFor(null)} onAdd={(text) => addComment(commentsFor, text)} />}
    <Modal isOpen={Boolean(imageFor)} title="Creative work" onClose={() => setImageFor(null)} maxWidth={800}>{imageFor && <img className="talent-modal-image" src={imageFor} alt="Enlarged creative work" />}</Modal>
  </div>;
}
