import React, { useState } from 'react';
import { Logo, Icon } from './Icons.jsx';

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'home' },
  { id: 'talent-feed', label: 'Talent Feed', icon: 'images' },
  { id: 'passport', label: 'Creative Passport', icon: 'compass' },
  { id: 'discover-app', label: 'Opportunities', icon: 'badge' },
  { id: 'collaborate', label: 'Collaborate', icon: 'users' },
  { id: 'events-app', label: 'Events', icon: 'calendar' },
  { id: 'portfolio', label: 'My Portfolio', icon: 'portfolio' }
];

export function AppShell({ active, onNavigate, onSignOut, currentUser, children }) {
  const [open, setOpen] = useState(false);

  const getInitials = (name) => {
    if (!name) return 'ST';
    return name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
  };

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className={open ? 'app-sidebar is-open' : 'app-sidebar'}>
        <div className="sidebar-brand">
          <Logo href="#dashboard" />
          <span className="sidebar-subtitle">SVM CREATIVE SPACE</span>
        </div>

        <nav aria-label="Student main navigation" className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className={active === item.id ? 'side-link active' : 'side-link'}
              onClick={() => {
                onNavigate(item.id);
                setOpen(false);
              }}
            >
              <Icon name={item.icon} size={18} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <button
            className={active === 'profile' ? 'side-link active' : 'side-link'}
            onClick={() => {
              onNavigate('profile');
              setOpen(false);
            }}
          >
            <Icon name="settings" size={17} />
            <span>Profile & Settings</span>
          </button>
          <button className="side-link sign-out" onClick={onSignOut}>
            <Icon name="arrowLeft" size={17} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="app-main">
        <header className="app-header">
          <div className="header-left">
            <button
              className="icon-button mobile-app-menu"
              onClick={() => setOpen(!open)}
              aria-label={open ? 'Close navigation' : 'Open navigation'}
            >
              <Icon name={open ? 'close' : 'menu'} size={20} />
            </button>
            <div className="breadcrumb">
              <span>SVM CultureLoop</span>
              <span className="breadcrumb-slash">/</span>
              <span className="breadcrumb-current">
                {NAV_ITEMS.find((item) => item.id === active)?.label || 'Profile'}
              </span>
            </div>
          </div>

          <div className="app-header-actions">
            <button
              className="action-button-pill"
              onClick={() => onNavigate('talent-feed')}
              title="Share your creative work"
            >
              <Icon name="plus" size={15} />
              <span>Share your talent</span>
            </button>

            <button
              className="profile-pill"
              onClick={() => onNavigate('profile')}
              aria-label="View profile"
            >
              <span className="profile-avatar">{getInitials(currentUser?.name)}</span>
              <span className="profile-name">{currentUser?.name || 'Aarav Sharma'}</span>
            </button>
          </div>
        </header>

        <main className="app-content">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({ eyebrow, title, copy, action }) {
  return (
    <div className="page-header">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {copy && <p className="page-copy">{copy}</p>}
      </div>
      {action && <div className="page-header-action">{action}</div>}
    </div>
  );
}
