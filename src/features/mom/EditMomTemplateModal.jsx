import { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext.jsx';

export default function EditMomTemplateModal({ show, currentTemplate, onClose, onSave }) {
  const [template, setTemplate] = useState('');
  const { showToast } = useToast();

  useEffect(() => {
    if (show) {
      setTemplate(currentTemplate);
    }
  }, [show, currentTemplate]);

  if (!show) return null;

  const handleSave = () => {
    const trimmed = template.trim();
    if (!trimmed) {
      showToast('warning', 'Empty Template', 'Template cannot be empty.');
      return;
    }
    onSave(trimmed);
  };

  const handleReset = () => {
    if (window.confirm('Reset textarea to the saved template? Any unsaved changes will be lost.')) {
      setTemplate(currentTemplate);
    }
  };

  return (
    <div className="modal show edit-template-modal" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="modal-header">
          <h3><i className="fas fa-pen-fancy"></i> Edit MOM Template</h3>
          <button className="close-modal" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          <div className="placeholder-hint">
            <strong style={{ color: 'var(--primary)', display: 'block', marginBottom: '6px' }}>
              💡 Available placeholders:
            </strong>
            <code>{'{title}'}</code>
            <code>{'{date}'}</code>
            <code>{'{time}'}</code>
            <code>{'{type}'}</code>
            <code>{'{platform}'}</code>
            <code>{'{location}'}</code>
            <code>{'{link}'}</code>
            <code>{'{credentials}'}</code>
            <code>{'{attendees}'}</code>
            <code>{'{agenda}'}</code>
            <div style={{ marginTop: '8px' }}>
              These will be replaced with actual meeting data when generating a MOM.
            </div>
          </div>

          <textarea
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            placeholder="Enter your MOM template here..."
            spellCheck={false}
          />
        </div>

        <div className="modal-footer">
          <button className="secondary-btn" onClick={handleReset}>
            <i className="fas fa-undo"></i> Undo Changes
          </button>
          <button className="secondary-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="primary-btn" onClick={handleSave}>
            <i className="fas fa-save"></i> Save Template
          </button>
        </div>
      </div>
    </div>
  );
}
