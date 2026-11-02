import React, { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const interests = ['Music', 'Dance', 'Photography', 'Writing', 'Design', 'Theatre'];

const events = [
  { date: '12', month: 'DEC', title: 'SVM Unplugged', meta: 'Main Auditorium · 5:30 PM', type: 'Performance' },
  { date: '18', month: 'DEC', title: 'Frames of Campus', meta: 'Student Centre · All day', type: 'Exhibition' },
  { date: '08', month: 'JAN', title: 'Create Together', meta: 'Innovation Lab · 4:00 PM', type: 'Workshop' },
];

function Icon({ name, size = 20 }) {
  const paths = {
    arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    menu: <><path d="M4 6h16" /><path d="M4 12h16" /><path d="M4 18h16" /></>,
    close: <><path d="m6 6 12 12" /><path d="m18 6-12 12" /></>,
    spark: <><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" /><path d="m19 16 .7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16Z" /></>,
    play: <path d="m9 6 9 6-9 6V6Z" />,
    check: <path d="m5 12 4 4L19 6" />,
    instagram: <><rect width="18" height="18" x="3" y="3" rx="5" /><circle cx="12" cy="12" r="4" /><path d="M17.5 6.5h.01" /></>,
  };
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

function Logo() {
  return <a className="logo" href="#top" aria-label="SVM CultureLoop home"><span className="logo-mark">C</span><span>CultureLoop</span></a>;
}

function JoinModal({ onClose }) {
  const [submitted, setSubmitted] = useState(false);
  useEffect(() => {
    const handleKeyDown = (event) => event.key === 'Escape' && onClose();
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className="modal" role="dialog" aria-modal="true" aria-labelledby="join-title">
      <button className="icon-button modal-close" type="button" onClick={onClose} aria-label="Close join form"><Icon name="close" /></button>
      {submitted ? <div className="modal-success"><span className="success-icon"><Icon name="check" /></span><h2>You're on the list.</h2><p>We’ll help you find your creative people when CultureLoop opens at SVM.</p><button className="button button-dark" onClick={onClose}>Done</button></div> :
        <><p className="eyebrow">Join SVM CultureLoop</p><h2 id="join-title">Find your place in the creative community.</h2><p className="modal-copy">Get early access to opportunities, workshops and collaborators across SVM.</p>
          <form onSubmit={(event) => { event.preventDefault(); setSubmitted(true); }}>
            <label htmlFor="email">College email</label><input id="email" type="email" placeholder="you@svmit.ac.in" required autoFocus />
            <button className="button button-dark full-width" type="submit">Request access <Icon name="arrow" size={17} /></button>
          </form>
          <p className="form-note">No spam. Just opportunities worth showing up for.</p></>}
    </section>
  </div>;
}

function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [selected, setSelected] = useState([]);
  const toggleInterest = (interest) => setSelected((current) => current.includes(interest) ? current.filter((item) => item !== interest) : [...current, interest]);

  return <div id="top" className="app">
    <header className="site-header">
      <div className="nav-shell"><Logo /><nav className={menuOpen ? 'nav-links is-open' : 'nav-links'} aria-label="Main navigation">
        <a href="#discover" onClick={() => setMenuOpen(false)}>Discover</a><a href="#opportunities" onClick={() => setMenuOpen(false)}>Opportunities</a><a href="#showcase" onClick={() => setMenuOpen(false)}>Showcase</a><a href="#about" onClick={() => setMenuOpen(false)}>About SVM</a>
        <div className="mobile-nav-action"><button className="button button-dark" onClick={() => { setJoinOpen(true); setMenuOpen(false); }}>Join SVM <Icon name="arrow" size={16} /></button></div>
      </nav><div className="header-actions"><a className="sign-in" href="#signin">Sign in</a><button className="button button-dark header-cta" onClick={() => setJoinOpen(true)}>Join SVM <Icon name="arrow" size={16} /></button><button className="icon-button menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen}><Icon name={menuOpen ? 'close' : 'menu'} /></button></div></div>
    </header>

    <main>
      <section className="hero section-shell">
        <div className="hero-copy"><p className="eyebrow"><span className="eyebrow-dot" /> SVM Institute of Technology</p><h1>Your talent deserves <em>a stage.</em></h1><p className="hero-text">Discover your creative interests, find your people, and make something worth sharing — no experience required.</p><div className="hero-actions"><a href="#discover" className="button button-primary">Discover your talent <Icon name="arrow" size={17} /></a><a href="#opportunities" className="text-link">Explore opportunities <Icon name="arrow" size={17} /></a></div><div className="hero-note"><span className="avatar-stack"><span>R</span><span>A</span><span>S</span></span><span><strong>Made for every kind of creator.</strong><br />From first try to next big thing.</span></div></div>
        <div className="hero-art" aria-label="Abstract collage representing creative disciplines"><div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" /><div className="art-card art-main"><div className="art-label">01 / EXPRESSION</div><div className="portrait-shape"><span /></div><div className="art-caption">Make room<br /><strong>for your voice.</strong></div></div><div className="art-card art-small art-yellow"><span className="small-number">02</span><span className="art-scribble">✦</span><span className="small-caption">Move<br />with purpose.</span></div><div className="art-card art-small art-lilac"><span className="small-number">03</span><span className="circle-photo" /><span className="small-caption">See it<br />differently.</span></div><span className="floating-label">CREATIVE<br /><strong>ENERGY</strong></span></div>
      </section>

      <section id="discover" className="discover section-shell section-space"><div className="section-intro"><p className="eyebrow">Start anywhere</p><h2>There’s more to you<br /><em>than one major.</em></h2><p>CultureLoop makes it easy to try something new, share what you love, and build confidence along the way.</p></div><div className="interest-panel"><div className="panel-top"><span>What are you curious about?</span><span className="selection-count">{selected.length ? `${selected.length} selected` : 'Choose all that apply'}</span></div><div className="interest-grid">{interests.map((interest) => <button key={interest} className={selected.includes(interest) ? 'interest-chip selected' : 'interest-chip'} onClick={() => toggleInterest(interest)} aria-pressed={selected.includes(interest)}><span className="chip-icon">{selected.includes(interest) ? <Icon name="check" size={15} /> : '+'}</span>{interest}</button>)}</div><div className="panel-footer"><span><Icon name="spark" size={16} /> No experience required</span><button className="arrow-button" aria-label="Continue with selected interests"><Icon name="arrow" /></button></div></div></section>

      <section id="showcase" className="showcase section-space"><div className="section-shell"><div className="showcase-heading"><div><p className="eyebrow">A community in motion</p><h2>Make something<br /><em>worth remembering.</em></h2></div><a className="text-link" href="#opportunities">See all stories <Icon name="arrow" size={17} /></a></div><div className="showcase-grid"><article className="story-card story-feature"><div className="story-visual visual-purple"><span className="story-stamp">SVM / 2024</span><div className="visual-type">CREATE<br /><i>OUT LOUD</i></div><span className="story-play"><Icon name="play" size={19} /></span></div><div className="story-meta"><div><p className="story-category">FILMMAKING · AARAV P.</p><h3>Finding the frame between moments.</h3></div><span className="story-arrow"><Icon name="arrow" size={17} /></span></div></article><article className="story-card"><div className="story-visual visual-coral"><span className="story-stamp">STUDIO NOTES</span><div className="visual-bars"><span /><span /><span /><span /></div><div className="visual-note">the rhythm<br />of a <i>new idea</i></div></div><div className="story-meta"><div><p className="story-category">MUSIC · MEERA S.</p><h3>From humming along to leading the room.</h3></div><span className="story-arrow"><Icon name="arrow" size={17} /></span></div></article></div></div></section>

      <section id="opportunities" className="events-section section-space"><div className="section-shell"><div className="events-heading"><div><p className="eyebrow">Coming up at SVM</p><h2>Find your next <em>yes.</em></h2></div><a className="text-link" href="#join" onClick={() => setJoinOpen(true)}>View all opportunities <Icon name="arrow" size={17} /></a></div><div className="event-list">{events.map((event) => <article className="event-row" key={event.title}><div className="event-date"><strong>{event.date}</strong><span>{event.month}</span></div><div className="event-info"><span className="event-type">{event.type}</span><h3>{event.title}</h3><p>{event.meta}</p></div><button className="arrow-button event-arrow" aria-label={`View ${event.title}`}><Icon name="arrow" /></button></article>)}</div></div></section>

      <section id="about" className="closing-cta section-space"><div className="section-shell cta-inner"><div><p className="eyebrow">Your creative community is here</p><h2>Start with a spark.<br /><em>See where it takes you.</em></h2></div><button className="button button-light" onClick={() => setJoinOpen(true)}>Join CultureLoop <Icon name="arrow" size={17} /></button></div></section>
    </main>
    <footer className="site-footer"><div className="section-shell footer-inner"><Logo /><div className="footer-copy">A creative ecosystem for<br />the SVM community.</div><div className="footer-links"><a href="#discover">Discover</a><a href="#opportunities">Opportunities</a><a href="#showcase">Showcase</a></div><div className="footer-social"><a href="#instagram" aria-label="Instagram"><Icon name="instagram" /></a><span>© 2024 SVM CultureLoop</span></div></div></footer>
    {joinOpen && <JoinModal onClose={() => setJoinOpen(false)} />}
  </div>;
}

const dashboardOpportunities = [
  { title: 'Frames of Campus', category: 'Photography', meta: 'Workshop · 18 Dec · Student Centre', match: 'A good starting point for visual storytellers.' },
  { title: 'SVM Unplugged', category: 'Music', meta: 'Open stage · 12 Dec · Main Auditorium', match: 'Share a song, even if it is your first performance.' },
  { title: 'Create Together', category: 'Collaboration', meta: 'Open project · 08 Jan · Innovation Lab', match: 'Meet students across creative disciplines.' },
];

const passportInterests = ['Music', 'Singing', 'Dance', 'Photography', 'Videography', 'Filmmaking', 'Drawing', 'Painting', 'Graphic Design', 'Creative Writing', 'Theatre', 'Event Management'];
const dashboardNav = [
  ['dashboard', 'Dashboard'], ['discover-app', 'Discover'], ['showcase-app', 'Showcase'], ['collaborate', 'Collaborate'], ['events-app', 'Events'], ['portfolio', 'Portfolio'],
];

function AppIcon({ name, size = 18 }) {
  const paths = {
    home: <><path d="m3 10 9-7 9 7" /><path d="M5 9v11h14V9" /></>,
    compass: <><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2.2 4.8-4.8 2.2 2.2-4.8 4.8-2.2Z" /></>,
    spark: <><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" /><path d="m19 16 .7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16Z" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
    calendar: <><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>,
    portfolio: <><rect width="18" height="14" x="3" y="6" rx="2" /><path d="M8 6V4h8v2M12 11v4M9 13h6" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></>,
    arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    upload: <><path d="M12 16V4M7 9l5-5 5 5" /><path d="M5 20h14" /></>,
    menu: <><path d="M4 6h16M4 12h16M4 18h16" /></>,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
  };
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

function SignIn({ onSignIn }) {
  const [email, setEmail] = useState('');
  return <div className="auth-page"><div className="auth-card"><Logo /><p className="eyebrow">SVM student access</p><h1>Make room for your <em>next idea.</em></h1><p className="auth-copy">Sign in to discover opportunities, share your work and find creative collaborators across SVM.</p><form onSubmit={(event) => { event.preventDefault(); onSignIn(email || 'student@svmit.ac.in'); }}><label htmlFor="student-email">College email</label><input id="student-email" type="email" placeholder="you@svmit.ac.in" value={email} onChange={(event) => setEmail(event.target.value)} required /><button className="button button-dark full-width" type="submit">Continue to CultureLoop <AppIcon name="arrow" size={16} /></button></form><p className="auth-note">Authentication is not connected in this frontend yet. This preview keeps your session locally.</p></div><div className="auth-art"><span>CREATIVE<br /><strong>ENERGY</strong></span><div className="auth-art-card">Find your<br /><em>people.</em></div></div></div>;
}

function AppShell({ active, onNavigate, onSignOut, children }) {
  const [open, setOpen] = useState(false);
  return <div className="app-shell"><aside className={open ? 'app-sidebar is-open' : 'app-sidebar'}><div className="sidebar-brand"><Logo /><span>SVM STUDENT SPACE</span></div><nav aria-label="Student navigation">{dashboardNav.map(([id, label]) => <button key={id} className={active === id ? 'side-link active' : 'side-link'} onClick={() => { onNavigate(id); setOpen(false); }}><AppIcon name={id === 'dashboard' ? 'home' : id === 'discover-app' ? 'compass' : id === 'showcase-app' ? 'spark' : id === 'collaborate' ? 'users' : id === 'events-app' ? 'calendar' : 'portfolio'} />{label}</button>)}</nav><div className="sidebar-bottom"><button className="side-link" onClick={() => onNavigate('profile')}>Profile & settings</button><button className="side-link sign-out" onClick={onSignOut}>Sign out</button></div></aside><div className="app-main"><header className="app-header"><button className="icon-button mobile-app-menu" onClick={() => setOpen(!open)} aria-label={open ? 'Close navigation' : 'Open navigation'}><AppIcon name={open ? 'close' : 'menu'} /></button><div className="breadcrumb">SVM CultureLoop <span>/</span> {dashboardNav.find(([id]) => id === active)?.[1] || 'Profile'}</div><div className="app-header-actions"><button className="notification-button" aria-label="Notifications"><AppIcon name="bell" /><span /></button><button className="profile-pill" onClick={() => onNavigate('profile')}><span className="profile-avatar">AS</span><span className="profile-name">Aarav Sharma</span></button></div></header><main className="app-content">{children}</main></div></div>;
}

function PageHeader({ eyebrow, title, copy, action }) {
  return <div className="page-header"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1>{copy && <p className="page-copy">{copy}</p>}</div>{action}</div>;
}

function Dashboard({ onNavigate }) {
  return <><section className="welcome-panel"><div><p className="eyebrow">Monday, 02 December 2024</p><h1>Welcome back, Aarav.</h1><p>Your next creative idea starts here.</p></div><div className="welcome-mark"><AppIcon name="spark" size={28} /></div></section><div className="dashboard-grid"><section className="app-panel passport-summary"><div className="panel-heading"><div><p className="eyebrow">Your creative passport</p><h2>Keep exploring what makes you, <em>you.</em></h2></div><span className="completion">40% complete</span></div><div className="progress-track"><span /></div><div className="passport-tags"><span>Photography</span><span>Music</span><span>Writing</span></div><button className="text-link" onClick={() => onNavigate('passport')}>View Creative Passport <AppIcon name="arrow" size={16} /></button></section><section className="app-panel journey-card"><p className="eyebrow">Continue your journey</p><h2>Ready to share your first piece?</h2><p className="muted">Your showcase is waiting for a first experiment.</p><button className="button button-primary" onClick={() => onNavigate('showcase-app')}>Upload your work <AppIcon name="upload" size={16} /></button></section></div><section className="app-section"><div className="section-title-row"><div><p className="eyebrow">Selected for you</p><h2>Find your next <em>yes.</em></h2></div><button className="text-link" onClick={() => onNavigate('discover-app')}>View all <AppIcon name="arrow" size={16} /></button></div><div className="opportunity-grid">{dashboardOpportunities.map((item) => <article className="opportunity-card" key={item.title}><div className="card-kicker"><span>{item.category}</span><span className="match-dot" /></div><h3>{item.title}</h3><p>{item.meta}</p><div className="match-note">{item.match}</div><button className="card-link" onClick={() => onNavigate('discover-app')}>View details <AppIcon name="arrow" size={15} /></button></article>)}</div></section><div className="dashboard-lower"><section className="app-panel activity-panel"><div className="section-title-row"><div><p className="eyebrow">Your activity</p><h2>Small steps count.</h2></div></div><div className="empty-state"><div className="empty-icon"><AppIcon name="spark" /></div><p>No activity yet</p><span>Register for an event or upload your first creative work to begin.</span></div></section><section className="app-panel upcoming-panel"><div className="section-title-row"><div><p className="eyebrow">Coming up</p><h2>On the calendar.</h2></div><button className="text-link" onClick={() => onNavigate('events-app')}>All events</button></div>{events.slice(0, 2).map((event) => <div className="mini-event" key={event.title}><div className="mini-date"><strong>{event.date}</strong><span>{event.month}</span></div><div><h3>{event.title}</h3><p>{event.meta}</p></div><AppIcon name="arrow" size={16} /></div>)}</section></div></>;
}

function Discover({ onNavigate }) {
  const [query, setQuery] = useState('');
  const filtered = dashboardOpportunities.filter((item) => `${item.title} ${item.category}`.toLowerCase().includes(query.toLowerCase()));
  return <><PageHeader eyebrow="Explore the community" title={<>Find your next <em>creative opportunity.</em></>} copy="Try something new, meet your people and build confidence at your own pace." action={<button className="button button-dark" onClick={() => onNavigate('passport')}>Edit interests <AppIcon name="spark" size={16} /></button>} /><div className="discover-toolbar"><label className="search-field"><span>⌕</span><input aria-label="Search opportunities" placeholder="Search opportunities" value={query} onChange={(event) => setQuery(event.target.value)} /></label><select aria-label="Filter opportunities"><option>All categories</option><option>Workshops</option><option>Collaborations</option><option>Events</option></select><select aria-label="Filter experience"><option>Any experience</option><option>Beginner-friendly</option><option>Intermediate</option></select></div><div className="discover-list">{filtered.map((item) => <article className="discover-row" key={item.title}><div className="opportunity-icon"><AppIcon name={item.category === 'Music' ? 'spark' : item.category === 'Photography' ? 'compass' : 'users'} /></div><div className="discover-row-body"><div className="card-kicker"><span>{item.category}</span><span className="tag-soft">Beginner-friendly</span></div><h2>{item.title}</h2><p>{item.meta}</p><div className="match-note">{item.match}</div></div><button className="button button-light" onClick={() => onNavigate('events-app')}>View details <AppIcon name="arrow" size={15} /></button></article>)}</div></>;
}

function Passport() {
  const [selected, setSelected] = useState(['Photography', 'Music', 'Writing']);
  const [saved, setSaved] = useState(false);
  const toggle = (item) => setSelected((current) => current.includes(item) ? current.filter((value) => value !== item) : [...current, item]);
  return <><PageHeader eyebrow="Your creative identity" title={<>Creative <em>Passport.</em></>} copy="Tell us what you want to explore. You can change this anytime." action={<button className="button button-primary" onClick={() => setSaved(true)}>{saved ? 'Saved locally' : 'Save passport'} <AppIcon name="check" size={16} /></button>} /><div className="passport-layout"><section className="app-panel form-panel"><div className="section-title-row"><div><p className="eyebrow">01 / Interests</p><h2>What are you curious about?</h2></div><span className="selection-count">{selected.length} selected</span></div><div className="passport-grid">{passportInterests.map((interest) => <button key={interest} className={selected.includes(interest) ? 'passport-chip selected' : 'passport-chip'} onClick={() => toggle(interest)} aria-pressed={selected.includes(interest)}>{selected.includes(interest) && <AppIcon name="check" size={14} />}{interest}</button>)}</div><p className="helper-note"><AppIcon name="spark" size={15} /> No experience required. Every creative journey starts somewhere.</p></section><section className="app-panel form-panel"><p className="eyebrow">02 / Your introduction</p><h2>What should collaborators know?</h2><label htmlFor="intro">Short creative introduction</label><textarea id="intro" rows="5" placeholder="I like noticing the details others miss..." /><label htmlFor="goal">A goal for this semester</label><input id="goal" placeholder="Try one new creative format" /><label htmlFor="availability">Availability</label><select id="availability"><option>Weekday evenings</option><option>Weekend mornings</option><option>Flexible</option></select></section></div></>;
}

function Showcase() {
  const [file, setFile] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  return <><PageHeader eyebrow="Your creative work" title={<>Make something worth <em>remembering.</em></>} copy="Share a work-in-progress or a finished piece. You stay in control of who sees it." /><div className="showcase-layout"><section className="app-panel form-panel"><p className="eyebrow">New submission</p><label htmlFor="submission-title">Title</label><input id="submission-title" placeholder="Give your work a name" /><label htmlFor="submission-category">Category</label><select id="submission-category"><option>Photography</option><option>Music</option><option>Writing</option><option>Design</option></select><label htmlFor="submission-description">Description</label><textarea id="submission-description" rows="5" placeholder="What were you exploring?" /><label className="consent-row"><input type="checkbox" /> I consent to an AI evaluation of this work.</label><button className="button button-primary" onClick={() => setSubmitted(true)} disabled={!file || submitted}>{submitted ? 'Saved locally' : 'Save submission'} <AppIcon name="check" size={16} /></button></section><section className="app-panel upload-panel"><p className="eyebrow">Creative file</p><label className="upload-zone"><input type="file" accept="image/*,audio/*,video/*,.pdf,.txt" onChange={(event) => setFile(event.target.files?.[0] || null)} /><AppIcon name="upload" size={28} /><strong>{file ? file.name : 'Drop your work here'}</strong><span>{file ? 'Ready for local preview' : 'Images, audio, video, PDF or text up to 25 MB'}</span></label>{!file && <div className="empty-state compact"><p>No file selected</p><span>Backend storage is not connected in this project yet.</span></div>}</section></div></>;
}

function SimpleCollection({ type, onNavigate }) {
  const config = { collaborate: ['Collaboration hub', 'Find the people who make an idea possible.', 'Open projects'], 'events-app': ['Events at SVM', 'Show up for the moments that bring campus to life.', 'Upcoming events'], portfolio: ['Your portfolio', 'A considered home for the work you are proud of.', 'Portfolio preview'], profile: ['Profile & settings', 'Keep your student profile and privacy preferences up to date.', 'Account details'] }[type];
  return <><PageHeader eyebrow="SVM CultureLoop" title={<>{config[0]}.</>} copy={config[1]} /><section className="app-panel collection-empty"><div className="empty-icon"><AppIcon name={type === 'events-app' ? 'calendar' : type === 'collaborate' ? 'users' : 'portfolio'} size={23} /></div><h2>{config[2]} are not connected yet.</h2><p>This screen is ready for the SVM backend, but this repository currently has no API or authentication integration to load real data.</p><button className="button button-dark" onClick={() => onNavigate('dashboard')}>Back to dashboard <AppIcon name="arrow" size={16} /></button></section></>;
}

function AuthenticatedApp({ onSignOut }) {
  const [active, setActive] = useState('dashboard');
  const pages = { dashboard: <Dashboard onNavigate={setActive} />, 'discover-app': <Discover onNavigate={setActive} />, passport: <Passport />, 'showcase-app': <Showcase />, collaborate: <SimpleCollection type="collaborate" onNavigate={setActive} />, 'events-app': <SimpleCollection type="events-app" onNavigate={setActive} />, portfolio: <SimpleCollection type="portfolio" onNavigate={setActive} />, profile: <SimpleCollection type="profile" onNavigate={setActive} /> };
  return <AppShell active={active} onNavigate={setActive} onSignOut={onSignOut}>{pages[active]}</AppShell>;
}

function App() {
  const [route, setRoute] = useState(window.location.hash.replace('#', '') || 'landing');
  const [signedIn, setSignedIn] = useState(() => localStorage.getItem('cultureloop-session') === 'preview');
  useEffect(() => { const onHashChange = () => setRoute(window.location.hash.replace('#', '') || 'landing'); window.addEventListener('hashchange', onHashChange); return () => window.removeEventListener('hashchange', onHashChange); }, []);
  const signIn = () => { localStorage.setItem('cultureloop-session', 'preview'); setSignedIn(true); window.location.hash = 'dashboard'; };
  const signOut = () => { localStorage.removeItem('cultureloop-session'); setSignedIn(false); window.location.hash = 'signin'; };
  if (route === 'signin' && !signedIn) return <SignIn onSignIn={signIn} />;
  if (['dashboard', 'discover-app', 'passport', 'showcase-app', 'collaborate', 'events-app', 'portfolio', 'profile'].includes(route) && signedIn) return <AuthenticatedApp onSignOut={signOut} />;
  if (route === 'signin') return <AuthenticatedApp onSignOut={signOut} />;
  return <LandingPage />;
}

createRoot(document.getElementById('root')).render(<StrictMode><App /></StrictMode>);
