export default function ConfirmModal({ show, title, message, preview, confirmText, onConfirm, onCancel }) {
  if (!show) return null;

  return (
    <div className="modal show confirm-modal" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="modal-content">
        <div className="confirm-icon">
          <i className="fas fa-exclamation-triangle"></i>
        </div>
        <div className="confirm-title">{title || 'Are you sure?'}</div>
        <div className="confirm-message">{message || 'This action cannot be undone.'}</div>
        {preview && <div className="confirm-preview">"{preview}"</div>}
        <div className="confirm-actions">
          <button className="confirm-cancel" onClick={onCancel}>Cancel</button>
          <button className="confirm-delete" onClick={onConfirm}>
            {confirmText || 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
