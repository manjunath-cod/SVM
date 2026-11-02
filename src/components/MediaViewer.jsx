import React from 'react';
import { Icon } from './Icons.jsx';

export function MediaViewer({ fileUrl, fileType, fileName, title }) {
  if (!fileUrl) {
    return (
      <div className="media-placeholder">
        <Icon name="file" size={28} />
        <span>No media file attached</span>
      </div>
    );
  }

  const type = (fileType || '').toLowerCase();

  // Images
  if (type.startsWith('image/')) {
    return (
      <div className="media-viewer-container image-viewer">
        <img src={fileUrl} alt={title || fileName || 'Creative submission'} loading="lazy" />
      </div>
    );
  }

  // Audio
  if (type.startsWith('audio/')) {
    return (
      <div className="media-viewer-container audio-viewer">
        <div className="audio-header">
          <Icon name="music" size={24} />
          <div>
            <strong>{title || fileName}</strong>
            <span className="file-meta-sub">{fileName}</span>
          </div>
        </div>
        <audio controls src={fileUrl} className="custom-audio-player">
          Your browser does not support the audio element.
        </audio>
      </div>
    );
  }

  // Video
  if (type.startsWith('video/')) {
    return (
      <div className="media-viewer-container video-viewer">
        <video controls src={fileUrl} className="custom-video-player">
          Your browser does not support the video element.
        </video>
      </div>
    );
  }

  // PDF or Documents
  if (type === 'application/pdf') {
    return (
      <div className="media-viewer-container document-viewer">
        <div className="doc-header">
          <Icon name="file" size={24} />
          <span>{fileName || 'PDF Document'}</span>
          <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="button button-dark btn-sm">
            Open PDF <Icon name="arrow" size={14} />
          </a>
        </div>
        <iframe src={fileUrl} title={title || 'Document preview'} className="pdf-frame" />
      </div>
    );
  }

  // Generic or text fallback
  return (
    <div className="media-viewer-container file-viewer">
      <Icon name="file" size={24} />
      <div className="file-info">
        <strong>{fileName || 'Creative Artifact'}</strong>
        <span>{type || 'Binary file'}</span>
      </div>
      <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="button button-light btn-sm">
        View file <Icon name="arrow" size={14} />
      </a>
    </div>
  );
}

