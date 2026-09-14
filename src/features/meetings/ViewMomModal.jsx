import { escapeHtml } from '../../utils/helpers.js';

export default function ViewMomModal({ show, meeting, onClose }) {
  if (!show || !meeting || !meeting.mom) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(meeting.mom);
      alert('MOM copied to clipboard!');
    } catch (err) {
      alert('Failed to copy. Please try again.');
    }
  };

  const handlePrint = () => {
    const win = window.open('', '_blank', 'width=800,height=600');
    if (win) {
      win.document.write(`
        <html>
          <head><title>MOM - ${escapeHtml(meeting.title)}</title></head>
          <body style="font-family:monospace;padding:40px;background:#f8fafc;line-height:1.6;">
            <div style="max-width:800px;margin:0 auto;background:white;padding:40px;border-radius:12px;white-space:pre-wrap;">
              ${escapeHtml(meeting.mom).replace(/\n/g, '<br>')}
            </div>
          </body>
        </html>
      `);
      win.document.close();
      setTimeout(() => win.print(), 500);
    }
  };

  return (
    <div className="modal show" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content modal-large">
        <div className="modal-header">
          <h3><i className="fas fa-file-alt"></i> MOM — {escapeHtml(meeting.title)}</h3>
          <button className="close-modal" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          <div className="mom-preview" style={{ maxHeight: '500px' }}>
            {meeting.mom}
          </div>
        </div>

        <div className="modal-footer">
          <button className="secondary-btn" onClick={handleCopy}>
            <i className="fas fa-copy"></i> Copy
          </button>
          <button className="secondary-btn" onClick={handlePrint}>
            <i className="fas fa-print"></i> Print
          </button>
          <button className="primary-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
