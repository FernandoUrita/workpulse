import { useModalDialog } from '../../hooks/useModalDialog.js';
import { useState } from 'react';
import { useToast } from '../../context/ToastContext.jsx';
import { parseCSV, mapCSVToTicket } from '../../utils/csvHelpers.js';

export default function ImportModal({ show, taskType, existingTickets, onClose, onImport }) {
  const { showToast } = useToast();
  const [rawText, setRawText] = useState('');
  const [preview, setPreview] = useState([]);
  const [fileName, setFileName] = useState('');

  const reset = () => {
    setRawText('');
    setPreview([]);
    setFileName('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const dialogProps = useModalDialog(show, handleClose);
  if (!show) return null;

  const buildPreview = (text) => {
    try {
      const rows = parseCSV(text);
      const mapped = rows
        .filter(row => Object.values(row).some(v => v))
        .map(row => mapCSVToTicket(row))
        .filter(t => t.ticketNo || t.subject || t.clientName);

      const existingNos = new Set(
        existingTickets
          .filter(t => (t.taskType || 'support') === taskType)
          .map(t => t.ticketNo)
      );

      const withStatus = mapped.map(t => ({
        ...t,
        _isDuplicate: existingNos.has(t.ticketNo),
      }));

      setPreview(withStatus);
      return withStatus;
    } catch {
      showToast('error', 'Parse Error', 'Could not parse the data.');
      return [];
    }
  };

  const handlePaste = (e) => {
    const text = e.target.value;
    setRawText(text);
    if (text.trim()) buildPreview(text);
    else setPreview([]);
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      setRawText(text);
      buildPreview(text);
    };
    reader.readAsText(file);
  };

  const handleConfirm = () => {
    const valid = preview.filter(p => !p._isDuplicate && (p.ticketNo || p.subject));
    if (valid.length === 0) {
      showToast('warning', 'Nothing to Import', 'No valid rows found (duplicates skipped).');
      return;
    }

    const cleaned = valid.map(row => Object.fromEntries(Object.entries(row).filter(([key]) => key !== '_isDuplicate')));
    onImport(cleaned);
    showToast('success', 'Import Complete', `${cleaned.length} ticket(s) imported.`);
    reset();
    onClose();
  };

  const duplicateCount = preview.filter(p => p._isDuplicate).length;
  const validCount = preview.length - duplicateCount;

  return (
    <div className="modal show import-modal" onClick={(e) => e.target === e.currentTarget && handleClose()}>
      <div {...dialogProps} className="modal-content" style={{ maxWidth: '720px' }}>
        <div className="modal-header">
          <h3>
            <i className="fas fa-file-import"></i>
            Import Tickets
            <span className="import-task-type">
              {taskType === 'support' ? 'Support Task' : 'Project Task'}
            </span>
          </h3>
          <button className="close-modal" type="button" aria-label="Close dialog" onClick={handleClose}>&times;</button>
        </div>

        <div className="modal-body">
          <div className="import-tabs">
            <div className="import-section">
              <label className="import-label">
                <i className="fas fa-paste"></i> Paste from Spreadsheet
              </label>
              <textarea
                className="import-textarea"
                placeholder="Copy rows from Google Sheets / Excel and paste here (including header row)..."
                value={rawText}
                onChange={handlePaste}
                rows={6}
              />
            </div>

            <div className="import-or">OR</div>

            <div className="import-section">
              <label className="import-label">
                <i className="fas fa-file-csv"></i> Upload CSV File
              </label>
              <div className="import-file-wrapper">
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFile}
                  id="csv-upload"
                  style={{ display: 'none' }}
                />
                <label htmlFor="csv-upload" className="import-file-btn">
                  <i className="fas fa-upload"></i>
                  {fileName || 'Choose CSV file'}
                </label>
              </div>
            </div>
          </div>

          {preview.length > 0 && (
            <div className="import-preview">
              <div className="import-preview-header">
                <h4><i className="fas fa-list"></i> Preview</h4>
                <div className="import-preview-stats">
                  <span className="preview-stat valid">
                    <i className="fas fa-check-circle"></i> {validCount} valid
                  </span>
                  {duplicateCount > 0 && (
                    <span className="preview-stat duplicate">
                      <i className="fas fa-exclamation-triangle"></i> {duplicateCount} duplicate{duplicateCount !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
              <div className="import-preview-table">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Ticket No.</th>
                      <th>Client</th>
                      <th>Subject</th>
                      <th>Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.slice(0, 10).map((row, idx) => (
                      <tr key={idx} className={row._isDuplicate ? 'duplicate' : ''}>
                        <td>{idx + 1}</td>
                        <td>{row.ticketNo || '—'}</td>
                        <td>{row.clientName || '—'}</td>
                        <td className="truncate">{row.subject || row.remarks || '—'}</td>
                        <td>{row.status || '—'}</td>
                        <td>
                          {row._isDuplicate
                            ? <span className="dup-tag">Skip</span>
                            : <span className="ok-tag">OK</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {preview.length > 10 && (
                  <div className="import-preview-more">
                    + {preview.length - 10} more rows
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="secondary-btn" onClick={handleClose}>Cancel</button>
          <button
            className="primary-btn"
            onClick={handleConfirm}
            disabled={validCount === 0}
          >
            <i className="fas fa-file-import"></i> Import {validCount > 0 ? `(${validCount})` : ''}
          </button>
        </div>
      </div>
    </div>
  );
}
