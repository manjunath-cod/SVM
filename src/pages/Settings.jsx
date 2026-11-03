import React, { useEffect, useMemo, useState } from 'react';
import { Icon } from '../components/Icons.jsx';
import { Toast } from '../components/Toast.jsx';
import { api } from '../services/api.js';

const SETTINGS_NAV = [
  ['account', 'Account', 'user'],
  ['appearance', 'Appearance', 'eye'],
  ['notifications', 'Notifications', 'bell'],
  ['privacy', 'Privacy', 'shield'],
  ['accessibility', 'Accessibility', 'settings'],
  ['feedback', 'Feedback', 'pen'],
  ['support', 'Help & Support', 'info'],
  ['about', 'About SVM', 'badge'],
  ['signout', 'Sign Out', 'arrowLeft']
];

const defaultSettings = {
  theme: 'light',
  reduced_motion: false,
  interests: ['Music', 'Photography'],
  profile_visibility: 'campus',
  portfolio_visibility: 'campus',
  submission_visibility: 'campus',
  discoverable: true,
  collaboration_requests: 'open',
  ai_consent: true,
  notifications: {
    event_reminders: true,
    registration_updates: true,
    new_opportunities: true,
    collaboration_invitations: true,
    community_announcements: true,
    achievement_notifications: true
  }
};

const interestOptions = ['Music', 'Dance', 'Photography', 'Writing', 'Design', 'Theatre'];

function mergeSettings(saved = {}) {
  return {
    ...defaultSettings,
    ...saved,
    notifications: { ...defaultSettings.notifications, ...(saved.notifications || {}) },
    interests: Array.isArray(saved.interests) ? saved.interests : defaultSettings.interests
  };
}

export function Settings({ onSignOut, currentUser, onUserUpdated }) {
  const [active, setActive] = useState('account');
  const [profile, setProfile] = useState(currentUser || {});
  const [settings, setSettings] = useState(defaultSettings);
  const [name, setName] = useState(currentUser?.name || '');
  const [department, setDepartment] = useState(currentUser?.department || '');
  const [year, setYear] = useState(currentUser?.year_of_study || '');
  const [avatar, setAvatar] = useState(currentUser?.avatar_data || '');
  const [feedback, setFeedback] = useState({ category: 'bug', subject: '', description: '', contact_preference: 'none' });
  const [saving, setSaving] = useState(false);
  const [feedbackSaving, setFeedbackSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    Promise.all([api.getSettings(), api.getPassport()])
      .then(([settingsResponse, passportResponse]) => {
        const nextProfile = settingsResponse.profile || currentUser || {};
        const saved = mergeSettings(settingsResponse.settings);
        const passportInterests = passportResponse.interests?.map((item) => item.category) || [];
        setProfile(nextProfile);
        setName(nextProfile.name || '');
        setDepartment(nextProfile.department || '');
        setYear(nextProfile.year_of_study || '');
        setAvatar(nextProfile.avatar_data || '');
        setSettings({ ...saved, interests: passportInterests.length ? passportInterests : saved.interests });
        applyTheme(saved.theme);
        document.documentElement.classList.toggle('reduce-motion', saved.reduced_motion);
      })
      .catch(() => {
        setToast({ type: 'error', title: 'Settings unavailable', message: 'We could not load your saved preferences.' });
      });
  }, []);

  useEffect(() => {
    if (settings.theme !== 'system') return undefined;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const syncSystemTheme = () => applyTheme('system');
    media.addEventListener?.('change', syncSystemTheme);
    return () => media.removeEventListener?.('change', syncSystemTheme);
  }, [settings.theme]);

  const applyTheme = (theme) => {
    const dark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    localStorage.setItem('cultureloop-theme', theme);
  };

  const updateSettings = (patch) => setSettings((current) => ({ ...current, ...patch }));
  const updateNotifications = (key) => updateSettings({
    notifications: { ...settings.notifications, [key]: !settings.notifications[key] }
  });

  const saveSettings = async (message = 'Your settings have been saved.', nextSettings = settings) => {
    setSaving(true);
    try {
      const response = await api.updateSettings({ settings: nextSettings, avatar_data: avatar || null });
      setProfile(response.profile);
      setSettings(mergeSettings(response.settings));
      setToast({ type: 'success', title: 'Saved', message });
    } catch (err) {
      setToast({ type: 'error', title: 'Save failed', message: err.message });
    } finally {
      setSaving(false);
    }
  };

  const saveAccount = async (event) => {
    event.preventDefault();
    if (name.trim().length < 2) {
      setToast({ type: 'error', title: 'Check your name', message: 'Enter at least two characters.' });
      return;
    }
    setSaving(true);
    try {
      const response = await api.updateProfile({ name: name.trim(), department, year_of_study: year, avatar_data: avatar || null });
      await api.savePassport({ interests: settings.interests });
      await api.updateSettings({ settings, avatar_data: avatar || null });
      setProfile(response.profile);
      onUserUpdated?.(response.profile);
      setToast({ type: 'success', title: 'Account updated', message: 'Your editable student details are saved.' });
    } catch (err) {
      setToast({ type: 'error', title: 'Save failed', message: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatar = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 2 * 1024 * 1024) {
      setToast({ type: 'error', title: 'Photo not accepted', message: 'Choose an image smaller than 2 MB.' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setAvatar(String(reader.result));
    reader.readAsDataURL(file);
  };

  const handleFeedback = async (event) => {
    event.preventDefault();
    if (!feedback.subject.trim() || feedback.description.trim().length < 10) {
      setToast({ type: 'error', title: 'Add more detail', message: 'Subject is required and description must be at least 10 characters.' });
      return;
    }
    setFeedbackSaving(true);
    try {
      await api.submitFeedback(feedback);
      setFeedback({ category: 'bug', subject: '', description: '', contact_preference: 'none' });
      setToast({ type: 'success', title: 'Feedback sent', message: 'Thanks — your feedback was recorded for the SVM team.' });
    } catch (err) {
      setToast({ type: 'error', title: 'Could not send feedback', message: err.message });
    } finally {
      setFeedbackSaving(false);
    }
  };

  const signOut = () => {
    if (window.confirm('Sign out of SVM?')) onSignOut();
  };

  const section = useMemo(() => SETTINGS_NAV.find(([id]) => id === active), [active]);

  return (
    <div className="settings-page">
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
      <header className="settings-hero">
        <div>
          <p className="eyebrow">Personal workspace</p>
          <h1>Settings & <em>preferences.</em></h1>
          <p>Shape how SVM works for you. Changes are saved to your authenticated account.</p>
        </div>
        <div className="settings-hero-badge"><Icon name="settings" size={26} /></div>
      </header>

      <div className="settings-layout">
        <nav className="settings-nav" aria-label="Settings sections">
          {SETTINGS_NAV.map(([id, label, icon]) => (
            <button key={id} className={active === id ? 'settings-nav-item active' : 'settings-nav-item'} onClick={() => id === 'signout' ? signOut() : setActive(id)}>
              <Icon name={icon} size={17} /><span>{label}</span>
            </button>
          ))}
        </nav>

        <main className="settings-content" aria-labelledby="settings-section-title">
          <div className="settings-section-heading">
            <p className="eyebrow">{section[1]}</p>
            <h2 id="settings-section-title">{section[1]}</h2>
          </div>

          {active === 'account' && (
            <section className="settings-card">
              <p className="settings-card-intro">Update the details that represent you in SVM. Your institutional email remains protected.</p>
              <form className="settings-form" onSubmit={saveAccount}>
                <div className="avatar-editor">
                  <div className="settings-avatar">{avatar ? <img src={avatar} alt="" /> : (name || 'S').slice(0, 1).toUpperCase()}</div>
                  <div><strong>Profile photograph</strong><span>Optional · JPG, PNG up to 2 MB</span><label className="button button-light btn-sm" htmlFor="settings-avatar">Choose photo</label><input id="settings-avatar" type="file" accept="image/*" onChange={handleAvatar} hidden /></div>
                </div>
                <div className="settings-form-grid">
                  <label>Student name<input value={name} onChange={(e) => setName(e.target.value)} required /></label>
                  <label>Email address<input value={profile.email || ''} disabled className="input-disabled" /></label>
                  <label>Department<select value={department} onChange={(e) => setDepartment(e.target.value)}><option>Information Science & Engineering</option><option>Computer Science & Engineering</option><option>Electronics & Communication Engineering</option><option>Mechanical Engineering</option><option>Civil Engineering</option><option>Biotechnology</option><option>Basic Sciences & Humanities</option></select></label>
                  <label>Year of study<select value={year} onChange={(e) => setYear(e.target.value)}><option>1st Year</option><option>2nd Year</option><option>3rd Year</option><option>4th Year</option><option>Postgraduate / Alumni</option></select></label>
                </div>
                <fieldset><legend>Creative interests</legend><div className="settings-interest-grid">{interestOptions.map((interest) => <label key={interest} className="settings-check"><input type="checkbox" checked={settings.interests.includes(interest)} onChange={() => updateSettings({ interests: settings.interests.includes(interest) ? settings.interests.filter((item) => item !== interest) : [...settings.interests, interest] })} />{interest}</label>)}</div></fieldset>
                <div className="settings-actions"><button type="button" className="button button-light" onClick={() => { setName(profile.name || ''); setDepartment(profile.department || ''); setYear(profile.year_of_study || ''); }}>Cancel</button><button className="button button-primary" disabled={saving}>{saving ? 'Saving...' : 'Save changes'} <Icon name="check" size={16} /></button></div>
              </form>
            </section>
          )}

          {active === 'appearance' && <section className="settings-card"><p className="settings-card-intro">Choose the look that feels right. System default follows your operating-system preference.</p><div className="theme-options">{[['light', 'Light', 'Clean white and soft lavender surfaces.'], ['dark', 'Dark', 'Deep purple-black surfaces with comfortable contrast.'], ['system', 'System default', 'Automatically follow your device appearance.']].map(([value, label, copy]) => <button key={value} className={settings.theme === value ? 'theme-option selected' : 'theme-option'} onClick={() => { const next = { ...settings, theme: value }; updateSettings({ theme: value }); applyTheme(value); saveSettings('Appearance preference saved.', next); }}><span className={`theme-preview ${value}`}><span /></span><span><strong>{label}</strong><small>{copy}</small></span>{settings.theme === value && <Icon name="checkCircle" size={19} />}</button>)}</div></section>}

          {active === 'notifications' && <section className="settings-card"><p className="settings-card-intro">Control optional updates. Important account and security notifications cannot be disabled.</p><div className="preference-list"><Toggle title="Important account notifications" copy="Required security and account messages are always enabled." checked disabled onChange={() => {}} />{[['event_reminders', 'Event reminders', 'Get a nudge before registered events.'], ['registration_updates', 'Registration updates', 'Know when an event or opportunity changes.'], ['new_opportunities', 'New opportunities', 'Receive relevant auditions, workshops and calls.'], ['collaboration_invitations', 'Collaboration invitations', 'Be notified when someone wants to create with you.'], ['community_announcements', 'Community announcements', 'Occasional updates from the SVM community.'], ['achievement_notifications', 'Achievement notifications', 'Celebrate passport and portfolio milestones.']].map(([key, title, copy]) => <Toggle key={key} title={title} copy={copy} checked={settings.notifications[key]} onChange={() => { updateNotifications(key); }} />)}</div><button className="button button-primary" onClick={() => saveSettings('Notification preferences saved.')} disabled={saving}>Save notification settings</button></section>}

          {active === 'privacy' && <section className="settings-card"><p className="settings-card-intro">These controls describe who can discover your work inside SVM. Media submitted for AI evaluation is handled by the existing local evaluation service.</p><div className="settings-form"><SelectSetting label="Profile visibility" value={settings.profile_visibility} options={[['campus', 'SVM campus members'], ['private', 'Only me']]} onChange={(value) => updateSettings({ profile_visibility: value })} /><SelectSetting label="Portfolio visibility" value={settings.portfolio_visibility} options={[['campus', 'SVM campus members'], ['private', 'Only me']]} onChange={(value) => updateSettings({ portfolio_visibility: value })} /><SelectSetting label="Talent submission visibility" value={settings.submission_visibility} options={[['campus', 'SVM campus members'], ['private', 'Only me']]} onChange={(value) => updateSettings({ submission_visibility: value })} /><SelectSetting label="Collaboration requests" value={settings.collaboration_requests} options={[['open', 'Allow campus requests'], ['approval', 'Ask me first'], ['closed', 'Do not receive']]} onChange={(value) => updateSettings({ collaboration_requests: value })} /><Toggle title="Profile discoverability" copy="Let other students find your profile in campus discovery." checked={settings.discoverable} onChange={() => updateSettings({ discoverable: !settings.discoverable })} /><Toggle title="AI evaluation consent" copy="Allow submitted media to be processed for personalized AI feedback. This does not claim to delete previously submitted media." checked={settings.ai_consent} onChange={() => updateSettings({ ai_consent: !settings.ai_consent })} /></div><button className="button button-primary" onClick={() => saveSettings('Privacy preferences saved.')} disabled={saving}>Save privacy settings</button></section>}

          {active === 'accessibility' && <section className="settings-card"><p className="settings-card-intro">Make motion calmer without changing the information architecture or keyboard behavior.</p><Toggle title="Reduce motion" copy="Minimize non-essential animation throughout the application." checked={settings.reduced_motion} onChange={() => { const next = { ...settings, reduced_motion: !settings.reduced_motion }; updateSettings({ reduced_motion: next.reduced_motion }); document.documentElement.classList.toggle('reduce-motion', next.reduced_motion); }} /><button className="button button-primary" onClick={() => saveSettings('Accessibility preferences saved.')} disabled={saving}>Save accessibility settings</button></section>}

          {active === 'feedback' && <section className="settings-card"><p className="settings-card-intro">Tell us what would make SVM more useful. Your message is stored with your authenticated profile.</p><form className="settings-form" onSubmit={handleFeedback}><label>Feedback category<select value={feedback.category} onChange={(e) => setFeedback({ ...feedback, category: e.target.value })}><option value="bug">Bug report</option><option value="feature">Feature request</option><option value="ux">UI/UX suggestion</option><option value="general">General feedback</option><option value="other">Other</option></select></label><label>Subject<input value={feedback.subject} onChange={(e) => setFeedback({ ...feedback, subject: e.target.value })} required /></label><label>Description<textarea rows="6" value={feedback.description} onChange={(e) => setFeedback({ ...feedback, description: e.target.value })} required minLength={10} /></label><label>Contact preference<select value={feedback.contact_preference} onChange={(e) => setFeedback({ ...feedback, contact_preference: e.target.value })}><option value="none">No follow-up needed</option><option value="email">Follow up by my college email</option></select></label><button className="button button-primary" disabled={feedbackSaving}>{feedbackSaving ? 'Sending...' : 'Send feedback'} <Icon name="arrow" size={16} /></button></form></section>}

          {active === 'support' && <SupportSection />}
          {active === 'about' && <section className="settings-card about-card"><div className="about-mark">SVM</div><p className="eyebrow">About the platform</p><h3>Sangeeta Vrinda Madhyam</h3><p>SVM CultureLoop is a creative discovery space for students to explore interests, share work, find collaborators and participate in cultural activities.</p><p className="muted">Associated with KLE Technological University through the existing SVM project context.</p><div className="about-meta"><span>Application</span><strong>SVM ? Sangeeta Vrinda Madhyam</strong><span>Version</span><strong>0.1.0</strong></div></section>}
          {active === 'signout' && <section className="settings-card signout-card"><Icon name="arrowLeft" size={28} /><h3>Leave SVM?</h3><p>Your local authenticated session will be cleared and you will return to the public home page.</p><button className="button button-dark" onClick={signOut}>Sign out securely</button></section>}
        </main>
      </div>
    </div>
  );
}

function Toggle({ title, copy, checked, onChange, disabled = false }) {
  return <label className={`settings-toggle${disabled ? ' is-disabled' : ''}`}><span><strong>{title}</strong><small>{copy}</small></span><input type="checkbox" checked={checked} onChange={onChange} disabled={disabled} /><span className="toggle-track" aria-hidden="true"><span /></span></label>;
}

function SelectSetting({ label, value, options, onChange }) {
  return <label>{label}<select value={value} onChange={(event) => onChange(event.target.value)}>{options.map(([option, title]) => <option key={option} value={option}>{title}</option>)}</select></label>;
}

function SupportSection() {
  return <div className="settings-support-grid"><section className="settings-card support-card"><div className="support-brand"><Icon name="instagram" size={22} /><div><strong>Sangeeta Vrinda Madhyam</strong><span>Follow SVM for cultural activities, updates and announcements.</span></div></div><a className="button button-primary" href="https://www.instagram.com/sangeetavrindamadhyam?cplk=YWZ4ZnJyd3M1cGtq" target="_blank" rel="noopener noreferrer">Open Instagram <Icon name="arrow" size={16} /></a></section><section className="settings-card faq-card"><h3>Common questions</h3><details><summary>How do I register for events?</summary><p>Open Events from the main navigation, select an event and use its registration action.</p></details><details><summary>How do I upload creative work?</summary>  <p>Open Talent Feed to share a creative post with the student community.</p></details><details><summary>How do I contact an SVM administrator?</summary><p>Use Feedback in Settings for a recorded request. This project does not publish an administrator contact address.</p></details></section></div>;
}
