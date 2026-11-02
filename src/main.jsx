import React, { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

import { AppShell } from './components/Navigation.jsx';
import { LandingPage } from './pages/LandingPage.jsx';
import { SignIn } from './pages/SignIn.jsx';
import { Dashboard } from './pages/Dashboard.jsx';
import { TalentFeed } from './pages/TalentFeed.jsx';
import { Passport } from './pages/Passport.jsx';
import { Discover } from './pages/Discover.jsx';
import { Collaborate } from './pages/Collaborate.jsx';
import { Events } from './pages/Events.jsx';
import { Portfolio } from './pages/Portfolio.jsx';
import { Settings } from './pages/Settings.jsx';
import { api } from './services/api.js';

function App() {
  const [route, setRoute] = useState(() => window.location.hash.replace('#', '') || 'landing');
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);

  // Sync route on hashchange
  useEffect(() => {
    const handleHashChange = () => {
      const nextRoute = window.location.hash.replace('#', '') || 'landing';
      setRoute(nextRoute);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Check existing session
  useEffect(() => {
    checkSession();
  }, []);

  useEffect(() => {
    const preference = localStorage.getItem('cultureloop-theme') || 'light';
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      document.documentElement.dataset.theme = preference === 'dark' || (preference === 'system' && media.matches) ? 'dark' : 'light';
    };
    apply();
    if (preference === 'system') {
      media.addEventListener?.('change', apply);
      return () => media.removeEventListener?.('change', apply);
    }
  }, []);

  const checkSession = async () => {
    const savedEmail = localStorage.getItem('cultureloop-user-email');
    if (savedEmail) {
      try {
        const session = await api.getSession();
        if (session?.user) {
          setCurrentUser(session.user);
        }
      } catch (err) {
        console.warn('Session check warning:', err.message);
      }
    }
    setLoadingSession(false);
  };

  const handleSignIn = async (email, onError) => {
    try {
      const res = await api.signIn(email);
      localStorage.setItem('cultureloop-user-email', email);
      localStorage.setItem('cultureloop-session', 'active');
      setCurrentUser(res.user);
      window.location.hash = 'dashboard';
    } catch (err) {
      onError?.('We could not connect to the CultureLoop session. Restart the dev server and try again.');
      throw err;
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('cultureloop-user-email');
    localStorage.removeItem('cultureloop-session');
    setCurrentUser(null);
    window.location.hash = 'top';
  };

  const navigateTo = (pageId) => {
    window.location.hash = pageId;
  };

  // Determine active authenticated view
  const authenticatedRoutes = [
    'dashboard',
    'talent-feed',
    'passport',
    'discover-app',
    'collaborate',
    'events-app',
    'portfolio',
    'profile',
    'settings'
  ];

  const isAuthenticated = Boolean(currentUser);

  if (loadingSession) {
    return (
      <div className="app-loading-screen">
        <div className="logo-mark">C</div>
        <span>Loading SVM CultureLoop...</span>
      </div>
    );
  }

  // If user navigated to signin and is not signed in
  if (route === 'signin' && !isAuthenticated) {
    return <SignIn onSignIn={handleSignIn} />;
  }

  // If user is signed in and visits an app route (or signin while already signed in)
  if (isAuthenticated && (authenticatedRoutes.includes(route) || route === 'signin')) {
    const activePage = authenticatedRoutes.includes(route) ? route : 'dashboard';

    const renderActivePage = () => {
      switch (activePage) {
        case 'dashboard':
          return <Dashboard onNavigate={navigateTo} currentUser={currentUser} />;
        case 'talent-feed':
          return <TalentFeed currentUser={currentUser} />;
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
              onUserUpdated={(u) => setCurrentUser(u)}
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
      onExplore={() => navigateTo('signin')}
      onJoin={handleSignIn}
    />
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
