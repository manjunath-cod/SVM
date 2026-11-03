import React, { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

import { AppShell } from './components/Navigation.jsx';
import { LandingPage } from './pages/LandingPage.jsx';
import { Dashboard } from './pages/Dashboard.jsx';
import { TalentFeed } from './pages/TalentFeed.jsx';
import { Achievements } from './pages/Achievements.jsx';
import { Passport } from './pages/Passport.jsx';
import { Discover } from './pages/Discover.jsx';
import { Collaborate } from './pages/Collaborate.jsx';
import { Events } from './pages/Events.jsx';
import { Portfolio } from './pages/Portfolio.jsx';
import { Settings } from './pages/Settings.jsx';
import { subscribeToAuth, signOut } from './services/auth.js';
import { getUserProfile } from './services/firestore.js';
import { firebaseConfigured } from './services/firebase.js';
import { SignIn } from './pages/SignIn.jsx';

function App() {
  const [route, setRoute] = useState(() => window.location.hash.replace('#', '') || 'landing');
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('cultureloop-user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [authLoading, setAuthLoading] = useState(firebaseConfigured);

  // Sync route on hashchange
  useEffect(() => {
    const handleHashChange = () => {
      const nextRoute = window.location.hash.replace('#', '') || 'landing';
      setRoute(nextRoute);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    if (!firebaseConfigured) {
      setAuthLoading(false);
      return undefined;
    }
    return subscribeToAuth(async (user) => {
      if (!user) {
        // If not authenticated via Firebase, check if user had a local demo session
        const localSaved = localStorage.getItem('cultureloop-user');
        if (localSaved) {
          try {
            setCurrentUser(JSON.parse(localSaved));
          } catch {
            setCurrentUser(null);
          }
        } else {
          setCurrentUser(null);
        }
        setAuthLoading(false);
        return;
      }
      try {
        const profile = await getUserProfile(user.uid);
        const resolved = profile || {
          id: user.uid,
          uid: user.uid,
          name: user.displayName || 'SVM Student',
          email: user.email || ''
        };
        setCurrentUser(resolved);
        try {
          localStorage.setItem('cultureloop-user', JSON.stringify(resolved));
          localStorage.setItem('cultureloop-user-email', resolved.email || '');
        } catch { /* ignore */ }
      } catch {
        const fallback = {
          id: user.uid,
          uid: user.uid,
          name: user.displayName || 'SVM Student',
          email: user.email || ''
        };
        setCurrentUser(fallback);
      }
      setAuthLoading(false);
    });
  }, []);

  useEffect(() => {
    const preference = localStorage.getItem('cultureloop-theme') || 'light';
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      document.documentElement.dataset.theme =
        preference === 'dark' || (preference === 'system' && media.matches) ? 'dark' : 'light';
    };
    apply();
    if (preference === 'system') {
      media.addEventListener?.('change', apply);
      return () => media.removeEventListener?.('change', apply);
    }
  }, []);

  const handleSignOut = async () => {
    if (firebaseConfigured) {
      try {
        await signOut();
      } catch { /* ignore */ }
    }
    try {
      localStorage.removeItem('cultureloop-user');
      localStorage.removeItem('cultureloop-user-email');
      localStorage.removeItem('cultureloop-session');
    } catch { /* ignore */ }
    setCurrentUser(null);
    window.location.hash = 'top';
  };

  const handleUserSignedIn = (user) => {
    if (user) {
      setCurrentUser(user);
      try {
        localStorage.setItem('cultureloop-user', JSON.stringify(user));
        localStorage.setItem('cultureloop-user-email', user.email || '');
        localStorage.setItem('cultureloop-session', 'active');
      } catch { /* ignore */ }
    }
    window.location.hash = 'dashboard';
  };

  const navigateTo = (pageId) => {
    window.location.hash = pageId;
  };

  // Determine active authenticated view
  const authenticatedRoutes = [
    'dashboard',
    'talent-feed',
    'achievements',
    'passport',
    'discover-app',
    'collaborate',
    'events-app',
    'portfolio',
    'profile',
    'settings'
  ];

  if (authLoading) {
    return (
      <div className="loading-state">
        <p>Restoring your SVM session...</p>
      </div>
    );
  }

  if (route === 'signin') {
    return <SignIn onSignedIn={handleUserSignedIn} />;
  }

  if (authenticatedRoutes.includes(route) && !currentUser) {
    return <SignIn onSignedIn={handleUserSignedIn} />;
  }

  if (authenticatedRoutes.includes(route)) {
    const activePage = authenticatedRoutes.includes(route) ? route : 'dashboard';

    const renderActivePage = () => {
      switch (activePage) {
        case 'dashboard':
          return <Dashboard onNavigate={navigateTo} currentUser={currentUser} />;
        case 'talent-feed':
          return <TalentFeed currentUser={currentUser} />;
        case 'achievements':
          return <Achievements onNavigate={navigateTo} currentUser={currentUser} />;
        case 'passport':
          return <Passport onNavigate={navigateTo} currentUser={currentUser} />;
        case 'discover-app':
          return <Discover onNavigate={navigateTo} currentUser={currentUser} />;
        case 'collaborate':
          return <Collaborate onNavigate={navigateTo} currentUser={currentUser} />;
        case 'events-app':
          return <Events onNavigate={navigateTo} currentUser={currentUser} />;
        case 'portfolio':
          return <Portfolio onNavigate={navigateTo} currentUser={currentUser} />;
        case 'profile':
        case 'settings':
          return (
            <Settings
              onSignOut={handleSignOut}
              currentUser={currentUser}
              onUserUpdated={(u) => {
                setCurrentUser(u);
                try {
                  localStorage.setItem('cultureloop-user', JSON.stringify(u));
                } catch { /* ignore */ }
              }}
            />
          );
        default:
          return <Dashboard onNavigate={navigateTo} currentUser={currentUser} />;
      }
    };

    return (
      <AppShell
        active={activePage}
        onNavigate={navigateTo}
        onSignOut={handleSignOut}
        currentUser={currentUser}
      >
        {renderActivePage()}
      </AppShell>
    );
  }

  // Public Landing Page
  return (
    <LandingPage
      onExplore={() => navigateTo('dashboard')}
    />
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
