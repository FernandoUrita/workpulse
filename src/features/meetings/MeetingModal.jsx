import { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext.jsx';
import { MEETING_PLATFORMS } from '../../utils/constants.js';

const EMPTY = {
  title: '',
  date: '',
  time: '',
  type: '',
  platform: '',
  link: '',
  physicalLocation: '',
  anydeskId: '',
  anydeskPassword: '',
  teamviewerId: '',
  teamviewerPassword: '',
};

export default function MeetingModal({ show, meeting, onClose, onSave }) {
  const [form, setForm] = useState(EMPTY);
  const [attendees, setAttendees] = useState([]);
  const [agenda, setAgenda] = useState([]);
  const [attendeeInput, setAttendeeInput] = useState('');
  const [agendaInput, setAgendaInput] = useState('');
  const { showToast } = useToast();

  useEffect(() => {
    if (show) {
      if (meeting) {
        setForm({
          title: meeting.title || '',
          date: meeting.date || '',
          time: meeting.time || '',
          type: meeting.type || '',
          platform: meeting.platform || '',
          link: meeting.link || '',
          physicalLocation: meeting.type === 'physical' ? (meeting.location || '') : '',
          anydeskId: meeting.anydeskId || '',
          anydeskPassword: meeting.anydeskPassword || '',
          teamviewerId: meeting.teamviewerId || '',
          teamviewerPassword: meeting.teamviewerPassword || '',
        });
        setAttendees(meeting.attendees || []);
        setAgenda(meeting.agenda || []);
      } else {
        setForm(EMPTY);
        setAttendees([]);
        setAgenda([]);
      }
      setAttendeeInput('');
      setAgendaInput('');
    }
  }, [show, meeting]);

  if (!show) return null;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const setType = (type) => {
    setForm({ ...form, type });
  };

  const addAttendee = () => {
    const name = attendeeInput.trim();
    if (!name) return;
    if (attendees.includes(name)) {
      showToast('warning', 'Duplicate', 'Attendee already added.');
      setAttendeeInput('');
      return;
    }
    setAttendees([...attendees, name]);
    setAttendeeInput('');
  };

  const removeAttendee = (name) => {
    setAttendees(attendees.filter(a => a !== name));
  };

  const addAgenda = () => {
    const item = agendaInput.trim();
    if (!item) return;
    setAgenda([...agenda, item]);
    setAgendaInput('');
  };

  const removeAgenda = (index) => {
    setAgenda(agenda.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!form.title.trim()) {
      showToast('warning', 'Missing Title', 'Please enter a meeting title.');
      return;
    }
    if (!form.date || !form.time) {
      showToast('warning', 'Missing Date/Time', 'Please enter date and time.');
      return;
    }
    if (!form.type) {
      showToast('warning', 'No Meeting Type', 'Please select Remote or Physical.');
      return;
    }
    if (attendees.length === 0) {
      showToast('warning', 'No Attendees', 'Please add at least one attendee.');
      return;
    }
    if (form.type === 'remote' && !form.platform) {
      showToast('warning', 'No Platform', 'Please select a platform.');
      return;
    }
    if (form.type === 'remote' && form.platform === 'anydesk' && !form.anydeskId.trim()) {
      showToast('warning', 'Missing AnyDesk ID', 'Please enter AnyDesk ID.');
      return;
    }
    if (form.type === 'remote' && form.platform === 'teamviewer' && !form.teamviewerId.trim()) {
      showToast('warning', 'Missing TeamViewer ID', 'Please enter TeamViewer ID.');
      return;
    }
    if (form.type === 'physical' && !form.physicalLocation.trim()) {
      showToast('warning', 'No Location', 'Please enter location.');
      return;
    }

    const platformLabels = {
      zoom: 'Zoom', teams: 'Microsoft Teams', gmeet: 'Google Meet',
      viber: 'Viber Call', anydesk: 'AnyDesk', teamviewer: 'TeamViewer',
    };

    const meetingData = {
      title: form.title.trim(),
      date: form.date,
      time: form.time,
      type: form.type,
      platform: form.type === 'remote' ? form.platform : '',
      link: form.link.trim(),
      attendees,
      agenda,
    };

    if (form.type === 'remote') {
      meetingData.location = form.platform === 'anydesk' ? 'AnyDesk'
        : form.platform === 'teamviewer' ? 'TeamViewer'
        : platformLabels[form.platform] || form.platform;
      meetingData.anydeskId = form.anydeskId.trim();
      meetingData.anydeskPassword = form.anydeskPassword.trim();
      meetingData.teamviewerId = form.teamviewerId.trim();
      meetingData.teamviewerPassword = form.teamviewerPassword.trim();
    } else {
      meetingData.location = form.physicalLocation.trim();
    }

    onSave(meetingData);
    showToast(
      'success',
      meeting ? 'Meeting Updated' : 'Meeting Scheduled',
      `"${form.title.trim()}" has been ${meeting ? 'updated' : 'scheduled'}.`
    );
  };

  return (
    <div className="modal show" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content modal-large">
        <div className="modal-header">
          <h3>
            <i className={`fas fa-${meeting ? 'edit' : 'calendar-plus'}`}></i>
            {meeting ? ' Edit Meeting' : ' Schedule New Meeting'}
          </h3>
          <button className="close-modal" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          <div className="meeting-form-modal">
            <div className="form-grid">
              {/* Title */}
              <div className="form-group full-width">
                <label><i className="fas fa-tag"></i> Meeting Title *</label>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="e.g., Weekly Sprint Planning"
                  autoFocus
                />
              </div>

              {/* Date & Time */}
              <div className="form-group">
                <label><i className="fas fa-calendar-day"></i> Date *</label>
                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label><i className="fas fa-clock"></i> Time *</label>
                <input
                  type="time"
                  name="time"
                  value={form.time}
                  onChange={handleChange}
                />
              </div>

              {/* Meeting Type */}
              <div className="form-group full-width">
                <label><i className="fas fa-video"></i> Meeting Type *</label>
                <div className="meeting-type-selector">
                  <button
                    type="button"
                    className={`type-btn ${form.type === 'remote' ? 'active' : ''}`}
                    onClick={() => setType('remote')}
                  >
                    <i className="fas fa-laptop"></i>
                    <span>Online Meeting</span>
                  </button>
                  <button
                    type="button"
                    className={`type-btn ${form.type === 'physical' ? 'active' : ''}`}
                    onClick={() => setType('physical')}
                  >
                    <i className="fas fa-building"></i>
                    <span>On-site Meeting</span>
                  </button>
                </div>
              </div>

              {/* Remote Fields */}
              {form.type === 'remote' && (
                <div className="form-group full-width">
                  <div className="remote-fields-container">
                    <div className="form-group">
                      <label><i className="fas fa-plug"></i> Platform *</label>
                      <select name="platform" value={form.platform} onChange={handleChange}>
                        <option value="">Select platform...</option>
                        {MEETING_PLATFORMS.map(p => (
                          <option key={p.value} value={p.value}>
                            {p.icon} {p.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {form.platform === 'anydesk' && (
                      <div className="form-group">
                        <label><i className="fas fa-id-card"></i> AnyDesk Credentials</label>
                        <input
                          type="text"
                          name="anydeskId"
                          value={form.anydeskId}
                          onChange={handleChange}
                          placeholder="AnyDesk ID (e.g., 123-456-789)"
                        />
                        <input
                          type="text"
                          name="anydeskPassword"
                          value={form.anydeskPassword}
                          onChange={handleChange}
                          placeholder="AnyDesk Password (optional)"
                          style={{ marginTop: '8px' }}
                        />
                      </div>
                    )}

                    {form.platform === 'teamviewer' && (
                      <div className="form-group">
                        <label><i className="fas fa-id-card"></i> TeamViewer Credentials</label>
                        <input
                          type="text"
                          name="teamviewerId"
                          value={form.teamviewerId}
                          onChange={handleChange}
                          placeholder="TeamViewer ID (e.g., 123 456 789)"
                        />
                        <input
                          type="text"
                          name="teamviewerPassword"
                          value={form.teamviewerPassword}
                          onChange={handleChange}
                          placeholder="TeamViewer Password"
                          style={{ marginTop: '8px' }}
                        />
                      </div>
                    )}

                    <div className="form-group">
                      <label><i className="fas fa-link"></i> Meeting Link</label>
                      <input
                        type="text"
                        name="link"
                        value={form.link}
                        onChange={handleChange}
                        placeholder="Enter meeting link..."
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Physical Fields */}
              {form.type === 'physical' && (
                <div className="form-group full-width">
                  <div className="physical-fields-container">
                    <div className="form-group">
                      <label><i className="fas fa-map-marker-alt"></i> Location *</label>
                      <input
                        type="text"
                        name="physicalLocation"
                        value={form.physicalLocation}
                        onChange={handleChange}
                        placeholder="Room number, building, address..."
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Attendees */}
              <div className="form-group full-width">
                <label><i className="fas fa-users"></i> Attendees *</label>
                <div className="attendee-input-group">
                  <input
                    type="text"
                    value={attendeeInput}
                    onChange={(e) => setAttendeeInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAttendee())}
                    placeholder="Enter name..."
                  />
                  <button type="button" className="secondary-btn" onClick={addAttendee}>
                    <i className="fas fa-plus"></i> Add
                  </button>
                </div>
                <div className="attendee-tags">
                  {attendees.length === 0 ? (
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      No attendees added yet
                    </span>
                  ) : (
                    attendees.map(name => (
                      <span key={name} className="attendee-tag">
                        {name}
                        <button type="button" className="remove-tag" onClick={() => removeAttendee(name)}>×</button>
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Agenda */}
              <div className="form-group full-width">
                <label><i className="fas fa-list"></i> Agenda Items</label>
                <div className="agenda-input-group">
                  <input
                    type="text"
                    value={agendaInput}
                    onChange={(e) => setAgendaInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAgenda())}
                    placeholder="Enter agenda item..."
                  />
                  <button type="button" className="secondary-btn" onClick={addAgenda}>
                    <i className="fas fa-plus"></i> Add
                  </button>
                </div>
                <div className="agenda-items">
                  {agenda.length === 0 ? (
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      No agenda items added
                    </span>
                  ) : (
                    agenda.map((item, i) => (
                      <span key={i} className="agenda-item">
                        {item}
                        <button type="button" className="remove-tag" onClick={() => removeAgenda(i)}>×</button>
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="secondary-btn" onClick={onClose}>Cancel</button>
          <button className="primary-btn" onClick={handleSubmit}>
            <i className="fas fa-calendar-check"></i> {meeting ? 'Update' : 'Schedule'} Meeting
          </button>
        </div>
      </div>
    </div>
  );
}
