import React, { useState } from 'react';
import { Logo, Icon } from '../components/Icons.jsx';
import { Modal } from '../components/Modal.jsx';

const interests = ['Music', 'Dance', 'Photography', 'Writing', 'Design', 'Theatre'];

const defaultEvents = [
  { date: '12', month: 'DEC', title: 'SVM Unplugged', meta: 'Main Auditorium · 5:30 PM', type: 'Performance' },
  { date: '18', month: 'DEC', title: 'Frames of Campus', meta: 'Student Centre · All day', type: 'Exhibition' },
  { date: '08', month: 'JAN', title: 'Create Together', meta: 'Innovation Lab · 4:00 PM', type: 'Workshop' },
];

export function LandingPage({ onExplore, onJoin }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [selected, setSelected] = useState([]);
  const [joinEmail, setJoinEmail] = useState('');
  const [joinSubmitted, setJoinSubmitted] = useState(false);

  const toggleInterest = (interest) => {
    setSelected((current) =>
      current.includes(interest) ? current.filter((item) => item !== interest) : [...current, interest]
    );
  };

  const handleJoinSubmit = async (e) => {
    e.preventDefault();
    if (!onJoin) {
      setJoinSubmitted(true);
      return;
    }

    await onJoin(joinEmail.trim());
  };

  const handleDirectJoin = () => {
    onJoin?.('student@svmit.ac.in');
  };

  return (
    <div id="top" className="app">
      <header className="site-header">
        <div className="nav-shell">
          <Logo />
          <nav className={menuOpen ? 'nav-links is-open' : 'nav-links'} aria-label="Main navigation">
            <a href="#discover" onClick={() => setMenuOpen(false)}>Discover</a>
            <a href="#opportunities" onClick={() => setMenuOpen(false)}>Opportunities</a>
            <a href="#about" onClick={() => setMenuOpen(false)}>About SVM</a>
            <div className="mobile-nav-action">
              <button
                className="button button-dark"
                onClick={() => {
                  handleDirectJoin();
                  setMenuOpen(false);
                }}
              >
                Join SVM <Icon name="arrow" size={16} />
              </button>
            </div>
          </nav>
          <div className="header-actions">
            <button className="button button-dark header-cta" onClick={handleDirectJoin}>
              Join SVM <Icon name="arrow" size={16} />
            </button>
            <button
              className="icon-button menu-button"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
            >
              <Icon name={menuOpen ? 'close' : 'menu'} />
            </button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="hero section-shell">
          <div className="hero-copy">
            <p className="eyebrow">
              <span className="eyebrow-dot" /> SVM Institute of Technology
            </p>
            <h1>
              Your talent deserves <em>a stage.</em>
            </h1>
            <p className="hero-text">
              Discover your creative interests, find your people, and make something worth sharing — no experience required. Powered by genuine AI mentorship.
            </p>
            <div className="hero-actions">
              <a href="#signin" className="button button-primary">
                Open Student Space <Icon name="arrow" size={17} />
              </a>
              <a href="#discover" className="text-link">
                Explore disciplines <Icon name="arrow" size={17} />
              </a>
            </div>
            <div className="hero-note">
              <span className="avatar-stack">
                <span>R</span>
                <span>A</span>
                <span>S</span>
              </span>
              <span>
                <strong>Made for every kind of creator.</strong>
                <br />
                From first try to next big thing.
              </span>
            </div>
          </div>

          <div className="hero-art" aria-label="Abstract collage representing creative disciplines">
            <div className="art-orbit orbit-one" />
            <div className="art-orbit orbit-two" />
            <div className="art-card art-main">
              <div className="art-label">01 / EXPRESSION</div>
              <div className="portrait-shape">
                <span />
              </div>
              <div className="art-caption">
                Make room
                <br />
                <strong>for your voice.</strong>
              </div>
            </div>
            <div className="art-card art-small art-yellow">
              <span className="small-number">02</span>
              <span className="art-scribble">✦</span>
              <span className="small-caption">
                Move
                <br />
                with purpose.
              </span>
            </div>
            <div className="art-card art-small art-lilac">
              <span className="small-number">03</span>
              <span className="circle-photo" />
              <span className="small-caption">
                See it
                <br />
                differently.
              </span>
            </div>
            <span className="floating-label">
              CREATIVE
              <br />
              <strong>ENERGY</strong>
            </span>
          </div>
        </section>

        {/* Discover Section */}
        <section id="discover" className="discover section-shell section-space">
          <div className="section-intro">
            <p className="eyebrow">Start anywhere</p>
            <h2>
              There’s more to you
              <br />
              <em>than one major.</em>
            </h2>
            <p>CultureLoop makes it easy to try something new, share what you love, and build confidence along the way.</p>
          </div>

          <div className="interest-panel">
            <div className="panel-top">
              <span>What are you curious about?</span>
              <span className="selection-count">
                {selected.length ? `${selected.length} selected` : 'Choose all that apply'}
              </span>
            </div>
            <div className="interest-grid">
              {interests.map((interest) => (
                <button
                  key={interest}
                  className={selected.includes(interest) ? 'interest-chip selected' : 'interest-chip'}
                  onClick={() => toggleInterest(interest)}
                  aria-pressed={selected.includes(interest)}
                >
                  <span className="chip-icon">
                    {selected.includes(interest) ? <Icon name="check" size={15} /> : '+'}
                  </span>
                  {interest}
                </button>
              ))}
            </div>
            <div className="panel-footer">
              <span>
                <Icon name="spark" size={16} /> No experience required
              </span>
              <a
                className="arrow-button"
                href="#signin"
                aria-label="Continue with selected interests"
              >
                <Icon name="arrow" />
              </a>
            </div>
          </div>
        </section>

        {/* Showcase Stories */}
        <section id="showcase" className="showcase section-space">
          <div className="section-shell">
            <div className="showcase-heading">
              <div>
                <p className="eyebrow">A community in motion</p>
                <h2>
                  Make something
                  <br />
                  <em>worth remembering.</em>
                </h2>
              </div>
              <a className="text-link" href="#signin">
                Enter Showcase Hub <Icon name="arrow" size={17} />
              </a>
            </div>

            <div className="showcase-grid showcase-media-grid">
              <article className="story-card story-feature">
                <div className="story-visual media-visual">
                  <img src="/assets/cultureloop-festival.jpg" alt="Students celebrating at the SVM Youth Festival" />
                  <span className="story-stamp">SVM / 2026</span>
                </div>
                <div className="story-meta">
                  <div>
                    <p className="story-category">CAMPUS LIFE · SVM YOUTH FESTIVAL</p>
                    <h3>One campus, many ways to shine.</h3>
                  </div>
                  <span className="story-arrow">
                    <Icon name="arrow" size={17} />
                  </span>
                </div>
              </article>

              <article className="story-card">
                <div className="story-visual media-visual">
                  <video autoPlay loop muted playsInline preload="auto" poster="/assets/cultureloop-festival.jpg">
                    <source src="/assets/cultureloop-festival-1.mp4" type="video/mp4" />
                  </video>
                </div>
                <div className="story-meta">
                  <div>
                    <p className="story-category">FESTIVAL · LIVE MOMENTS</p>
                    <h3>Make memories together.</h3>
                  </div>
                  <span className="story-arrow">
                    <Icon name="arrow" size={17} />
                  </span>
                </div>
              </article>

              <article className="story-card">
                <div className="story-visual media-visual">
                  <video autoPlay loop muted playsInline preload="auto" poster="/assets/cultureloop-festival.jpg">
                    <source src="/assets/cultureloop-festival-2.mp4" type="video/mp4" />
                  </video>
                </div>
                <div className="story-meta">
                  <div>
                    <p className="story-category">FESTIVAL · ON STAGE</p>
                    <h3>Energy that brings everyone in.</h3>
                  </div>
                  <span className="story-arrow">
                    <Icon name="arrow" size={17} />
                  </span>
                </div>
              </article>

              <article className="story-card">
                <div className="story-visual media-visual">
                  <video autoPlay loop muted playsInline preload="auto" poster="/assets/cultureloop-festival.jpg">
                    <source src="/assets/cultureloop-festival-3.mp4" type="video/mp4" />
                  </video>
                </div>
                <div className="story-meta">
                  <div>
                    <p className="story-category">FESTIVAL · BEHIND THE SCENES</p>
                    <h3>Every performance starts with a team.</h3>
                  </div>
                  <span className="story-arrow">
                    <Icon name="arrow" size={17} />
                  </span>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* Coming Up Events */}
        <section id="opportunities" className="events-section section-space">
          <div className="section-shell">
            <div className="events-heading">
              <div>
                <p className="eyebrow">Coming up at SVM</p>
                <h2>
                  Find your next <em>yes.</em>
                </h2>
              </div>
              <a className="text-link" href="#signin">
                View all opportunities <Icon name="arrow" size={17} />
              </a>
            </div>

            <div className="event-list">
              {defaultEvents.map((event) => (
                <article className="event-row" key={event.title}>
                  <div className="event-date">
                    <strong>{event.date}</strong>
                    <span>{event.month}</span>
                  </div>
                  <div className="event-info">
                    <span className="event-type">{event.type}</span>
                    <h3>{event.title}</h3>
                    <p>{event.meta}</p>
                  </div>
                  <a href="#signin" className="arrow-button event-arrow" aria-label={`View ${event.title}`}>
                    <Icon name="arrow" />
                  </a>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Closing CTA */}
        <section id="about" className="closing-cta section-space">
          <div className="section-shell cta-inner">
            <div>
              <p className="eyebrow">Your creative community is here</p>
              <h2>
                Start with a spark.
                <br />
                <em>See where it takes you.</em>
              </h2>
            </div>
            <button className="button button-light" onClick={handleDirectJoin}>
              Join CultureLoop <Icon name="arrow" size={17} />
            </button>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="section-shell footer-inner">
          <Logo />
          <div className="footer-copy">
            A creative ecosystem for
            <br />
            the SVM community.
          </div>
          <div className="footer-links">
            <a href="#discover">Discover</a>
            <a href="#opportunities">Opportunities</a>
            <a href="#showcase">Showcase</a>
          </div>
          <div className="footer-social">
            <a href="#instagram" aria-label="Instagram">
              <Icon name="instagram" />
            </a>
            <span>© 2026 SVM CultureLoop</span>
          </div>
        </div>
      </footer>

      {/* Early Access Join Modal */}
      <Modal
        isOpen={joinOpen}
        onClose={() => {
          setJoinOpen(false);
          setJoinSubmitted(false);
        }}
        eyebrow="Join SVM CultureLoop"
        title={joinSubmitted ? "You're on the list." : "Find your place in the creative community."}
      >
        {joinSubmitted ? (
          <div className="modal-success">
            <span className="success-icon">
              <Icon name="check" size={24} />
            </span>
            <p>We’ll help you find your creative people when CultureLoop opens at SVM.</p>
            <button className="button button-dark" onClick={() => setJoinOpen(false)}>
              Explore my dashboard <Icon name="arrow" size={16} />
            </button>
          </div>
        ) : (
          <>
            <p className="modal-copy">Get early access to opportunities, workshops and collaborators across SVM.</p>
            <form onSubmit={handleJoinSubmit}>
              <label htmlFor="join-email">College email</label>
              <input
                id="join-email"
                type="email"
                placeholder="you@svmit.ac.in"
                value={joinEmail}
                onChange={(e) => setJoinEmail(e.target.value)}
                required
                autoFocus
              />
              <button className="button button-dark full-width" type="submit">
                Join and open dashboard <Icon name="arrow" size={17} />
              </button>
            </form>
            <p className="form-note">No spam. Just opportunities worth showing up for.</p>
          </>
        )}
      </Modal>
    </div>
  );
}
