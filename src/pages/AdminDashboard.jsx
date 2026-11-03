import React, { useState, useEffect } from 'react';
import { AdminLogo, Icon } from '../components/Icons.jsx';
import {
  getStudentsByStatus,
  updateStudentApprovalStatus,
  listAnnouncements,
  createAnnouncement,
  archiveAnnouncement,
  listAdminLogs
} from '../services/firestore.js';
import { signOut } from '../services/auth.js';

export function AdminDashboard({ currentUser, onSignOut }) {
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'approved' | 'rejected' | 'notices' | 'logs'
  const [students, setStudents] = useState({ pending: [], approved: [], rejected: [] });
  const [notices, setNotices] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState('');

  // New notice form state
  const [noticeForm, setNoticeForm] = useState({
    title: '',
    category: 'Auditions',
    priority: 'Normal',
    content: ''
  });
  const [submittingNotice, setSubmittingNotice] = useState(false);

  useEffect(() => {
    loadAllAdminData();
  }, []);

  const loadAllAdminData = async () => {
    setLoading(true);
    try {
      const [pendingList, approvedList, rejectedList, noticeList, logList] = await Promise.all([
        getStudentsByStatus('pending').catch(() => []),
        getStudentsByStatus('approved').catch(() => []),
        getStudentsByStatus('rejected').catch(() => []),
        listAnnouncements(true).catch(() => []),
        listAdminLogs(25).catch(() => [])
      ]);

      setStudents({
        pending: pendingList,
        approved: approvedList,
        rejected: rejectedList
      });
      setNotices(noticeList);
      setLogs(logList);
    } catch (err) {
      console.warn('Admin data fetch warning:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (student) => {
    const adminUid = currentUser?.uid || currentUser?.id || 'admin';
    try {
      await updateStudentApprovalStatus(adminUid, student.uid || student.id, 'approved');
      setActionMessage(`Approved student ${student.name || student.displayName}.`);
      setTimeout(() => setActionMessage(''), 4000);
      loadAllAdminData();
    } catch (err) {
      alert(`Approval error: ${err.message}`);
    }
  };

  const handleReject = async (student) => {
    const reason = prompt('Please enter a rejection reason (optional):', 'Incomplete credentials or non-student email');
    if (reason === null) return; // user cancelled

    const adminUid = currentUser?.uid || currentUser?.id || 'admin';
    try {
      await updateStudentApprovalStatus(adminUid, student.uid || student.id, 'rejected', reason);
      setActionMessage(`Rejected registration for ${student.name || student.displayName}.`);
      setTimeout(() => setActionMessage(''), 4000);
      loadAllAdminData();
    } catch (err) {
      alert(`Rejection error: ${err.message}`);
    }
  };

  const handlePublishNotice = async (e) => {
    e.preventDefault();
    if (!noticeForm.title.trim() || !noticeForm.content.trim()) return;

    setSubmittingNotice(true);
    try {
      await createAnnouncement({
        title: noticeForm.title.trim(),
        category: noticeForm.category,
        priority: noticeForm.priority,
        content: noticeForm.content.trim(),
        authorName: currentUser?.displayName || currentUser?.name || 'SVM Faculty Coordinator',
        authorId: currentUser?.uid || currentUser?.id || 'admin'
      });

      setNoticeForm({ title: '', category: 'Auditions', priority: 'Normal', content: '' });
      setActionMessage('Campus notice published successfully to students.');
      setTimeout(() => setActionMessage(''), 4000);
      loadAllAdminData();
    } catch (err) {
      alert(`Notice publishing error: ${err.message}`);
    } finally {
      setSubmittingNotice(false);
    }
  };

  const handleArchiveNotice = async (noticeId) => {
    if (!confirm('Are you sure you want to archive this notice?')) return;
    const adminUid = currentUser?.uid || currentUser?.id || 'admin';
    try {
      await archiveAnnouncement(noticeId, adminUid);
      setActionMessage('Notice archived.');
      setTimeout(() => setActionMessage(''), 4000);
      loadAllAdminData();
    } catch (err) {
      alert(`Archive error: ${err.message}`);
    }
  };

  const handleSignOutClick = async () => {
    await signOut();
    onSignOut?.();
    window.location.hash = 'admin/login';
  };

  return (
    <div className="admin-dashboard-container">
      {/* Admin Top Navigation */}
      <header className="admin-header">
        <div className="admin-header-left">
          <AdminLogo href="#admin" />
          <span className="admin-badge-role">Verified Coordinator</span>
        </div>
        <div className="admin-header-right">
          <div className="admin-user-info">
            <strong>{currentUser?.displayName || currentUser?.name || 'SVM Administrator'}</strong>
            <span>{currentUser?.email || 'admin@svmit.ac.in'}</span>
          </div>
          <button
            className="button button-light btn-sm"
            onClick={() => {
              window.location.hash = 'dashboard';
            }}
          >
            <Icon name="arrowLeft" size={14} /> Student View
          </button>
          <button className="button button-secondary btn-sm" onClick={handleSignOutClick}>
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Admin Content */}
      <main className="admin-main">
        {/* Metric Cards Banner */}
        <section className="admin-metrics-row">
          <div className="admin-stat-card" onClick={() => setActiveTab('pending')}>
            <div className="stat-card-icon pending-icon">
              <Icon name="userPlus" size={20} />
            </div>
            <div>
              <span className="stat-num">{students.pending.length}</span>
              <span className="stat-label">Pending Registrations</span>
            </div>
          </div>

          <div className="admin-stat-card" onClick={() => setActiveTab('approved')}>
            <div className="stat-card-icon approved-icon">
              <Icon name="userCheck" size={20} />
            </div>
            <div>
              <span className="stat-num">{students.approved.length}</span>
              <span className="stat-label">Approved Students</span>
            </div>
          </div>

          <div className="admin-stat-card" onClick={() => setActiveTab('notices')}>
            <div className="stat-card-icon notices-icon">
              <Icon name="bell" size={20} />
            </div>
            <div>
              <span className="stat-num">{notices.filter((n) => !n.archived).length}</span>
              <span className="stat-label">Active Campus Notices</span>
            </div>
          </div>

          <div className="admin-stat-card" onClick={() => setActiveTab('logs')}>
            <div className="stat-card-icon logs-icon">
              <Icon name="shield" size={20} />
            </div>
            <div>
              <span className="stat-num">{logs.length}</span>
              <span className="stat-label">Activity Audit Entries</span>
            </div>
          </div>
        </section>

        {actionMessage && (
          <div className="admin-action-banner" role="status">
            <Icon name="checkCircle" size={16} />
            <span>{actionMessage}</span>
          </div>
        )}

        {/* Admin Navigation Tabs */}
        <div className="admin-tab-toolbar">
          <div className="admin-tab-group" role="tablist">
            <button
              className={`admin-tab ${activeTab === 'pending' ? 'active' : ''}`}
              onClick={() => setActiveTab('pending')}
            >
              <span>Pending Approvals</span>
              {students.pending.length > 0 && (
                <span className="tab-counter-badge">{students.pending.length}</span>
              )}
            </button>

            <button
              className={`admin-tab ${activeTab === 'approved' ? 'active' : ''}`}
              onClick={() => setActiveTab('approved')}
            >
              <span>Approved Students</span>
              <span className="tab-count-muted">({students.approved.length})</span>
            </button>

            <button
              className={`admin-tab ${activeTab === 'rejected' ? 'active' : ''}`}
              onClick={() => setActiveTab('rejected')}
            >
              <span>Rejected List</span>
              <span className="tab-count-muted">({students.rejected.length})</span>
            </button>

            <button
              className={`admin-tab ${activeTab === 'notices' ? 'active' : ''}`}
              onClick={() => setActiveTab('notices')}
            >
              <span>Publish Notices</span>
            </button>

            <button
              className={`admin-tab ${activeTab === 'logs' ? 'active' : ''}`}
              onClick={() => setActiveTab('logs')}
            >
              <span>Activity Audit</span>
            </button>
          </div>

          <button className="button button-light btn-sm" onClick={loadAllAdminData} disabled={loading}>
            <Icon name="refresh" size={14} className={loading ? 'spin' : ''} /> Refresh Data
          </button>
        </div>

        {/* Tab 1: Pending Approvals */}
        {activeTab === 'pending' && (
          <section className="admin-panel">
            <div className="panel-title-bar">
              <div>
                <h2>Pending Student Registrations</h2>
                <p className="muted">
                  Review applicant details and creative interests. Approved students gain access to the student dashboard, passport, and talent community.
                </p>
              </div>
            </div>

            {students.pending.length === 0 ? (
              <div className="admin-empty-state">
                <Icon name="checkCircle" size={32} />
                <p>No pending registrations</p>
                <span>All student accounts have been reviewed.</span>
              </div>
            ) : (
              <div className="admin-cards-grid">
                {students.pending.map((student) => (
                  <article className="student-review-card" key={student.uid || student.id}>
                    <div className="review-card-top">
                      <div>
                        <h3>{student.name || student.displayName}</h3>
                        <span className="student-email-tag">{student.email}</span>
                      </div>
                      <span className="pending-pill">Pending Review</span>
                    </div>

                    <div className="review-meta-grid">
                      <div>
                        <span className="meta-label">Department</span>
                        <strong>{student.department || 'General'}</strong>
                      </div>
                      <div>
                        <span className="meta-label">Academic Year</span>
                        <strong>{student.academicYear || student.year_of_study || 'N/A'}</strong>
                      </div>
                    </div>

                    {student.creativeInterests?.length > 0 && (
                      <div className="interests-tag-cloud">
                        {student.creativeInterests.map((interest) => (
                          <span key={interest} className="interest-tag">
                            {interest}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="review-card-footer">
                      <span className="registered-date">
                        Registered: {student.createdAt?.slice(0, 10) || 'Recently'}
                      </span>
                      <div className="review-btn-row">
                        <button
                          className="button button-reject btn-sm"
                          onClick={() => handleReject(student)}
                        >
                          Reject
                        </button>
                        <button
                          className="button button-approve btn-sm"
                          onClick={() => handleApprove(student)}
                        >
                          <Icon name="check" size={14} /> Approve Student
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Tab 2: Approved Students */}
        {activeTab === 'approved' && (
          <section className="admin-panel">
            <div className="panel-title-bar">
              <div>
                <h2>Approved Active Students ({students.approved.length})</h2>
                <p className="muted">Active members of Sangeeta Vrinda Madhyam.</p>
              </div>
            </div>

            {students.approved.length === 0 ? (
              <div className="admin-empty-state">
                <p>No approved students found</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Student Name</th>
                      <th>Email</th>
                      <th>Department</th>
                      <th>Academic Year</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.approved.map((s) => (
                      <tr key={s.uid || s.id}>
                        <td>
                          <strong>{s.name || s.displayName}</strong>
                        </td>
                        <td>{s.email}</td>
                        <td>{s.department || 'N/A'}</td>
                        <td>{s.academicYear || s.year_of_study || 'N/A'}</td>
                        <td>
                          <span className="status-badge approved">Approved</span>
                        </td>
                        <td>
                          <button
                            className="button button-light btn-xs"
                            onClick={() => handleReject(s)}
                          >
                            Revoke Access
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* Tab 3: Rejected Students */}
        {activeTab === 'rejected' && (
          <section className="admin-panel">
            <div className="panel-title-bar">
              <div>
                <h2>Rejected Registrations ({students.rejected.length})</h2>
                <p className="muted">Applicants whose registrations were rejected or suspended.</p>
              </div>
            </div>

            {students.rejected.length === 0 ? (
              <div className="admin-empty-state">
                <p>No rejected applicants on record</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Student Name</th>
                      <th>Email</th>
                      <th>Department</th>
                      <th>Reason</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.rejected.map((s) => (
                      <tr key={s.uid || s.id}>
                        <td>{s.name || s.displayName}</td>
                        <td>{s.email}</td>
                        <td>{s.department || 'N/A'}</td>
                        <td>
                          <span className="rejection-reason-text">
                            {s.rejectionReason || 'Verification rejected by administrator'}
                          </span>
                        </td>
                        <td>
                          <button
                            className="button button-approve btn-xs"
                            onClick={() => handleApprove(s)}
                          >
                            Re-approve
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* Tab 4: Publish Notices */}
        {activeTab === 'notices' && (
          <section className="admin-panel">
            <div className="panel-title-bar">
              <div>
                <h2>Official Campus Notices &amp; Announcements</h2>
                <p className="muted">
                  Publish bulletins, audition calls, and event alerts displayed to all authenticated SVM students.
                </p>
              </div>
            </div>

            {/* Notice Composer Form */}
            <form onSubmit={handlePublishNotice} className="notice-composer-box">
              <h3>Create New Notice</h3>
              <div className="form-group">
                <label htmlFor="notice-title">Notice Title</label>
                <input
                  id="notice-title"
                  type="text"
                  placeholder="e.g. SVM Annual Fest Vocal & Dance Auditions"
                  value={noticeForm.title}
                  onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-grid-2col">
                <div className="form-group">
                  <label htmlFor="notice-cat">Category</label>
                  <select
                    id="notice-cat"
                    value={noticeForm.category}
                    onChange={(e) => setNoticeForm({ ...noticeForm, category: e.target.value })}
                  >
                    <option value="Auditions">Auditions &amp; Trials</option>
                    <option value="Event">Cultural Event</option>
                    <option value="Workshop">Creative Workshop</option>
                    <option value="Important Alert">Important Alert</option>
                    <option value="General Notice">General Announcement</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="notice-prio">Priority</label>
                  <select
                    id="notice-prio"
                    value={noticeForm.priority}
                    onChange={(e) => setNoticeForm({ ...noticeForm, priority: e.target.value })}
                  >
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent Alert</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="notice-content">Notice Details</label>
                <textarea
                  id="notice-content"
                  rows={4}
                  placeholder="Provide complete dates, venues, eligibility, and instructions for students..."
                  value={noticeForm.content}
                  onChange={(e) => setNoticeForm({ ...noticeForm, content: e.target.value })}
                  required
                />
              </div>

              <button className="button button-dark" type="submit" disabled={submittingNotice}>
                {submittingNotice ? 'Publishing Notice...' : 'Publish Official Notice'}{' '}
                <Icon name="arrow" size={15} />
              </button>
            </form>

            {/* List of Existing Notices */}
            <div className="existing-notices-container">
              <h3>Active Notices ({notices.filter((n) => !n.archived).length})</h3>
              {notices.length === 0 ? (
                <p className="muted">No notices published yet.</p>
              ) : (
                <div className="notices-list-grid">
                  {notices.map((n) => (
                    <article className={`notice-item-card ${n.archived ? 'is-archived' : ''}`} key={n.id}>
                      <div className="notice-header-row">
                        <div className="notice-badge-group">
                          <span className={`priority-pill prio-${n.priority?.toLowerCase()}`}>
                            {n.priority}
                          </span>
                          <span className="notice-cat-pill">{n.category}</span>
                        </div>
                        {!n.archived && (
                          <button
                            className="button button-light btn-xs"
                            onClick={() => handleArchiveNotice(n.id)}
                            title="Archive this notice"
                          >
                            Archive
                          </button>
                        )}
                        {n.archived && <span className="archived-tag">Archived</span>}
                      </div>
                      <h4>{n.title}</h4>
                      <p>{n.content}</p>
                      <div className="notice-meta-footer">
                        <span>By: {n.authorName}</span>
                        <span>{n.createdAt?.slice(0, 10)}</span>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Tab 5: Activity Logs */}
        {activeTab === 'logs' && (
          <section className="admin-panel">
            <div className="panel-title-bar">
              <div>
                <h2>Administrator Activity Audit Log</h2>
                <p className="muted">
                  Immutable security audit trail of all student approvals, rejections, and published bulletins.
                </p>
              </div>
            </div>

            {logs.length === 0 ? (
              <div className="admin-empty-state">
                <p>No activity logs recorded yet</p>
              </div>
            ) : (
              <div className="activity-audit-list">
                {logs.map((log) => (
                  <div className="audit-log-row" key={log.id}>
                    <div className="log-icon-col">
                      <Icon name="shield" size={16} />
                    </div>
                    <div className="log-details-col">
                      <strong>
                        {log.action?.replace('_', ' ').toUpperCase()} ·{' '}
                        {log.targetName || log.noticeTitle || log.details || ''}
                      </strong>
                      <span className="log-actor">
                        By {log.adminName || log.adminId || 'Admin'} · Target ID: {log.targetUserId || 'N/A'}
                      </span>
                    </div>
                    <span className="log-time">{log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Recent'}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

