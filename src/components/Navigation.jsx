import React, { useState } from 'react';
import { Logo, Icon } from './Icons.jsx';

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'home' },
  { id: 'talent-feed', label: 'Talent Feed', icon: 'images' },
  { id: 'achievements', label: 'Achievements', icon: 'badge' },
  { id: 'passport', label: 'Creative Passport', icon: 'compass' },
  { id: 'discover-app', label: 'Opportunities', icon: 'search' },
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
          <span className="sidebar-subtitle">SVM · SANGEETA VRINDA MADHYAM</span>
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
          {currentUser?.role === 'admin' && (
            <button
              className="side-link admin-shortcut-link"
              onClick={() => {
                window.location.hash = 'admin';
                setOpen(false);
              }}
            >
              <Icon name="shield" size={17} />
              <span>Admin Portal</span>
            </button>
          )}

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

      {/* Mobile Drawer Backdrop */}
      {open && <div className="sidebar-backdrop" onClick={() => setOpen(false)} aria-hidden="true" />}

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
              <span>SVM</span>
              <span className="breadcrumb-slash">/</span>
              <span className="breadcrumb-current">
                {NAV_ITEMS.find((i) => i.id === active)?.label || 'Overview'}
              </span>
            </div>
          </div>

          <div className="header-right">
            <div
              className="user-profile-pill"
              onClick={() => onNavigate('profile')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onNavigate('profile');
                }
              }}
              aria-label="User profile and settings"
            >
              <div className="avatar-circle">
                {currentUser?.avatar_data ? (
                  <img src={currentUser.avatar_data} alt="" className="avatar-img" />
                ) : (
                  <span>{getInitials(currentUser?.displayName || currentUser?.name)}</span>
                )}
              </div>
              <div className="user-info">
                <span className="user-name">
                  {currentUser?.displayName || currentUser?.name || 'SVM Student'}
                </span>
                <span className="user-role-badge">
                  {currentUser?.role === 'admin'
                    ? 'Admin'
                    : (currentUser?.department || 'Student')}
                </span>
              </div>
            </div>
          </div>
        </header>

        <main className="page-content" key={active}>{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({ eyebrow, title, copy, action }) {
  return (
    <div className="page-header-row">
      <div className="header-copy">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        {title && <h1>{title}</h1>}
        {copy && <p className="lead">{copy}</p>}
      </div>
      {action && <div className="header-action-slot">{action}</div>}
    </div>
  );
}
