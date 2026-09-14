import { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext.jsx';
import { useAppData } from '../../context/AppDataContext.jsx';
import { generateMomFromTemplate } from '../../utils/helpers.js';

export default function MomModal({ show, meeting, onClose, onComplete }) {
  const { momTemplate } = useAppData();
  const { showToast } = useToast();
  const [momText, setMomText] = useState('');
  const [isPreview, setIsPreview] = useState(false);

  useEffect(() => {
    if (show && meeting) {
      setMomText(generateMomFromTemplate(meeting, momTemplate));
      setIsPreview(false);
    }
  }, [show, meeting, momTemplate]);

  if (!show || !meeting) return null;

  const handleSave = () => {
    const trimmed = momText.trim();
    if (!trimmed) {
      showToast('warning', 'Empty MOM', 'Please enter MOM content.');
      return;
    }
    onComplete(meeting.id, trimmed);
    showToast('success', 'Meeting Completed', `MOM saved for "${meeting.title}".`);
  };

  const handlePreview = () => {
    setIsPreview(!isPreview);
  };

  const handleExport = () => {
    const blob = new Blob([momText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MOM_${meeting.title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('success', 'Exported', 'MOM file downloaded.');
  };

  return (
    <div className="modal show" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content modal-large">
        <div className="modal-header">
          <h3><i className="fas fa-file-alt"></i> Minutes of Meeting (MOM)</h3>
          <button className="close-modal" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            <strong>Meeting:</strong> {meeting.title} • {meeting.date} {meeting.time}
          </p>

          {isPreview ? (
            <div className="mom-preview">{momText}</div>
          ) : (
            <div className="mom-editor">
              <textarea
                value={momText}
                onChange={(e) => setMomText(e.target.value)}
                rows={20}
                placeholder="Enter meeting minutes here..."
              />
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="secondary-btn" onClick={handlePreview}>
            <i className={`fas fa-${isPreview ? 'edit' : 'eye'}`}></i>
            {isPreview ? ' Edit' : ' Preview'}
          </button>
          <button className="secondary-btn" onClick={handleExport}>
            <i className="fas fa-download"></i> Export
          </button>
          <button className="secondary-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="primary-btn" onClick={handleSave}>
            <i className="fas fa-check"></i> Complete Meeting
          </button>
        </div>
      </div>
    </div>
  );
}
