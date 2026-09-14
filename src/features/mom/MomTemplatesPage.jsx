import { useState } from 'react';
import { useAppData } from '../../context/AppDataContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import EditMomTemplateModal from './EditMomTemplateModal.jsx';
import ConfirmModal from '../../components/common/ConfirmModal.jsx';

export default function MomTemplatesPage() {
  const { 
    momTemplate, 
    updateMomTemplate, 
    resetMomTemplate,
    defaultMomTemplate,
  } = useAppData();
  const { showToast } = useToast();

  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleSave = (newTemplate) => {
    updateMomTemplate(newTemplate);
    setShowEditModal(false);
    showToast('success', 'Template Saved', 'Your MOM template has been updated.');
  };

  const handleResetConfirm = () => {
    resetMomTemplate();
    setShowResetConfirm(false);
    showToast('success', 'Template Reset', 'MOM template restored to default.');
  };

  const isUsingDefault = momTemplate === defaultMomTemplate;

  return (
    <section className="module">
      <div className="module-header">
        <h3><i className="fas fa-file-alt"></i> MOM Templates</h3>
        {!isUsingDefault && (
          <div className="module-actions">
            <span 
              style={{
                background: '#fef3c7',
                color: '#d97706',
                padding: '6px 14px',
                borderRadius: '40px',
                fontSize: '12px',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <i className="fas fa-pen"></i> Custom Template
            </span>
          </div>
        )}
      </div>

      <div className="template-hints">
        <strong>💡 How it works</strong>
        This template is used when you click <strong>"End Meeting & MOM"</strong> on any meeting. 
        The <code>{'{title}'}</code>, <code>{'{date}'}</code>, <code>{'{attendees}'}</code>, 
        and other placeholders will be automatically replaced with actual meeting data.
      </div>

      <div className="template-management">
        <div className="template-actions">
          <button className="primary-btn" onClick={() => setShowEditModal(true)}>
            <i className="fas fa-edit"></i> Edit Template
          </button>
          <button 
            className="secondary-btn" 
            onClick={() => setShowResetConfirm(true)}
            disabled={isUsingDefault}
            style={{ opacity: isUsingDefault ? 0.5 : 1, cursor: isUsingDefault ? 'not-allowed' : 'pointer' }}
          >
            <i className="fas fa-undo"></i> Reset to Default
          </button>
        </div>

        <div className="template-preview">
          <h4><i className="fas fa-eye"></i> Current Template</h4>
          <pre>{momTemplate}</pre>
        </div>
      </div>

      <EditMomTemplateModal
        show={showEditModal}
        currentTemplate={momTemplate}
        onClose={() => setShowEditModal(false)}
        onSave={handleSave}
      />

      <ConfirmModal
        show={showResetConfirm}
        title="Reset to Default Template?"
        message="Your current MOM template will be replaced with the default template. This action cannot be undone."
        confirmText="Reset Template"
        onConfirm={handleResetConfirm}
        onCancel={() => setShowResetConfirm(false)}
      />
    </section>
  );
}
