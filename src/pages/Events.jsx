import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/Navigation.jsx';
import { Icon } from '../components/Icons.jsx';
import { Toast } from '../components/Toast.jsx';
import { api } from '../services/api.js';

export function Events({ onNavigate }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rsvpingId, setRsvpingId] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const data = await api.getEvents();
      setEvents(data.events || []);
    } catch (err) {
      console.warn('Failed to load events:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRsvp = async (eventId, title) => {
    setRsvpingId(eventId);
    try {
      const res = await api.rsvpEvent(eventId);
      setToast({
        type: res.rsvpd ? 'success' : 'info',
        title: res.rsvpd ? 'RSVP Confirmed!' : 'RSVP Cancelled',
        message: res.rsvpd
          ? `You are attending "${title}". Added to your creative schedule.`
          : `Removed RSVP for "${title}".`
      });
      loadEvents();
    } catch (err) {
      setToast({
        type: 'error',
        title: 'RSVP failed',
        message: err.message
      });
    } finally {
      setRsvpingId(null);
    }
  };

  return (
    <div className="events-page">
      <PageHeader
        eyebrow="SVM Campus Cultural Calendar"
        title={
          <>
            Show up for the moments <em>that bring campus to life.</em>
          </>
        }
        copy="Performances, visual exhibitions, interdisciplinary open jams, and student-led theatre nights across SVM venues."
      />

      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      {loading ? (
        <div className="loading-state">
          <Icon name="refresh" size={24} className="spin" />
          <p>Loading campus events schedule...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <Icon name="calendar" size={24} />
          </div>
          <p>No upcoming events scheduled right now</p>
          <span>Check back soon or explore campus opportunities.</span>
        </div>
      ) : (
        <div className="events-list-vertical">
          {events.map((evt) => {
            const isGoing = Boolean(evt.user_rsvpd);
            return (
              <article className="event-full-card" key={evt.id}>
                <div className="event-calendar-badge">
                  <strong>{evt.date}</strong>
                  <span>{evt.month}</span>
                </div>

                <div className="event-details-body">
                  <div className="event-header-row">
                    <span className="event-type-tag">{evt.type}</span>
                    <span className="event-category-tag">{evt.category}</span>
                    {isGoing && (
                      <span className="event-rsvp-badge">
                        <Icon name="check" size={12} /> You're Going
                      </span>
                    )}
                  </div>

                  <h2>{evt.title}</h2>
                  <p className="event-description">{evt.description}</p>

                  <div className="event-meta-line">
                    <span>
                      <Icon name="calendar" size={14} /> {evt.time}
                    </span>
                    <span> · </span>
                    <span>
                      <Icon name="compass" size={14} /> {evt.venue}
                    </span>
                  </div>
                </div>

                <div className="event-actions-col">
                  <span className="attendees-count">
                    <Icon name="users" size={14} /> {evt.rsvp_count} going
                  </span>
                  <button
                    className={`button ${isGoing ? 'button-light button-registered' : 'button-dark'}`}
                    onClick={() => handleToggleRsvp(evt.id, evt.title)}
                    disabled={rsvpingId === evt.id}
                  >
                    <Icon name={isGoing ? 'check' : 'arrow'} size={15} />
                    {rsvpingId === evt.id
                      ? 'Updating...'
                      : isGoing
                      ? 'RSVP Confirmed'
                      : 'RSVP / Attend'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

