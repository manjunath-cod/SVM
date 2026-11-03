import React, { useState } from 'react';
import { Logo, Icon } from '../components/Icons.jsx';
import { getUserProfile } from '../services/firestore.js';
import { signOut } from '../services/auth.js';

export function PendingApproval({ currentUser, onApproved, onSignOut }) {
  const [checking, setChecking] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const checkStatus = async () => {
    setChecking(true);
    setStatusMessage('');
    try {
      const uid = currentUser?.uid || currentUser?.id;
      if (!uid) {
        setStatusMessage('No session found. Please sign in again.');
        return;
      }

      const updated = await getUserProfile(uid);
      if (updated?.approvalStatus === 'approved') {
        setStatusMessage('Congratulations! Your account has been approved.');
        onApproved?.({ ...currentUser, ...updated, approvalStatus: 'approved' });
        setTimeout(() => {
          window.location.hash = 'dashboard';
        }, 1200);
      } else if (updated?.approvalStatus === 'rejected') {
        setStatusMessage(`Registration rejected: ${updated.rejectionReason || 'Please contact SVM coordinators.'}`);
      } else {
        setStatusMessage('Account is still pending administrator review. Please check back shortly.');
      }
    } catch (err) {
      setStatusMessage(err.message || 'Error checking verification status.');
    } finally {
      setChecking(false);
    }
  };

  const handleSimulateApproval = () => {
    // For demonstration purposes
    const approvedUser = {
      ...currentUser,
      approvalStatus: 'approved'
    };
    try {
      localStorage.setItem('svm_active_session', JSON.stringify(approvedUser));
      localStorage.setItem('cultureloop-user', JSON.stringify(approvedUser));
    } catch { /* ignore */ }
    onApproved?.(approvedUser);
    window.location.hash = 'dashboard';
  };

  return (
    <div className="auth-page pending-approval-page">
      <div className="auth-card pending-card">
        <Logo href="#landing" />
        
        <div className="pending-badge-row">
          <span className="pending-status-chip">
            <Icon name="refresh" size={14} className={checking ? 'spin' : ''} />
            <span>Pending Administrator Approval</span>
          </span>
        </div>

        <h1>
          Your creative space is <em>being prepared.</em>
        </h1>

        <p className="auth-copy">
          Thank you for registering with <strong>Sangeeta Vrinda Madhyam (SVM)</strong>. To maintain the authenticity and safety of our student community, all registrations are reviewed by the SVM Faculty Coordinator or Cultural Council.
        </p>

        <div className="student-credential-card">
          <div className="credential-row">
            <span className="cred-label">Student Name:</span>
            <strong>{currentUser?.displayName || currentUser?.name || 'SVM Student'}</strong>
          </div>
          <div className="credential-row">
            <span className="cred-label">College Email:</span>
            <strong>{currentUser?.email || 'student@svmit.ac.in'}</strong>
          </div>
          <div className="credential-row">
            <span className="cred-label">Department:</span>
            <span>{currentUser?.department || 'Engineering'}</span>
          </div>
          <div className="credential-row">
            <span className="cred-label">Academic Year:</span>
            <span>{currentUser?.academicYear || currentUser?.year_of_study || '3rd Year'}</span>
          </div>
          <div className="credential-row">
            <span className="cred-label">Current Status:</span>
            <span className="status-highlight-pending">Under Review by SVM Administration</span>
          </div>
        </div>

        {statusMessage && (
          <div className={`status-feedback-box ${statusMessage.includes('approved') ? 'is-success' : 'is-info'}`} role="status">
            <Icon name={statusMessage.includes('approved') ? 'checkCircle' : 'info'} size={16} />
            <span>{statusMessage}</span>
          </div>
        )}

        <div className="pending-actions-col">
          <button
            className="button button-dark full-width"
            onClick={checkStatus}
            disabled={checking}
          >
            {checking ? 'Checking verification status...' : 'Check Approval Status'} <Icon name="refresh" size={15} />
          </button>

          <button
            className="button button-light full-width"
            onClick={async () => {
              await signOut();
              onSignOut?.();
              window.location.hash = 'landing';
            }}
          >
            Sign out & return to home
          </button>
        </div>

        {/* Demo-friendly bypass */}
        <div className="demo-approval-helper">
          <div className="demo-helper-header">
            <Icon name="spark" size={13} />
            <span>Demonstration Shortcut</span>
          </div>
          <p>Evaluating this app for a presentation? You can simulate instant admin approval below:</p>
          <button
            type="button"
            className="button button-secondary btn-sm"
            onClick={handleSimulateApproval}
          >
            Approve & Enter Student Portal (Demo)
          </button>
        </div>
      </div>
    </div>
  );
}

