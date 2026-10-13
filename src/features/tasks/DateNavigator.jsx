import { todayISO } from '../../utils/helpers.js';

const PRESETS = [
  { id: 'today', label: 'Today', icon: 'fa-calendar-day' },
  { id: 'tomorrow', label: 'Tomorrow', icon: 'fa-calendar-plus' },
  { id: 'week', label: 'This Week', icon: 'fa-calendar-week' },
  { id: 'all', label: 'All Dates', icon: 'fa-layer-group' },
];

export default function DateNavigator({ mode, activeDate, onChange }) {
  const handlePreset = (id) => {
    onChange({ mode: id, activeDate: id === 'today' ? todayISO() : activeDate });
  };

  const handlePrev = () => {
    let baseDate = activeDate;
    if (mode === 'all' || mode === 'week') baseDate = todayISO();
    const d = new Date(baseDate + 'T00:00:00');
    d.setDate(d.getDate() - 1);
    onChange({ mode: 'custom', activeDate: d.toISOString().slice(0, 10) });
  };

  const handleNext = () => {
    let baseDate = activeDate;
    if (mode === 'all' || mode === 'week') baseDate = todayISO();
    const d = new Date(baseDate + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    onChange({ mode: 'custom', activeDate: d.toISOString().slice(0, 10) });
  };

  const handlePickerChange = (e) => {
    if (!e.target.value) return;
    onChange({ mode: 'custom', activeDate: e.target.value });
  };

  const pickerValue = (mode === 'all' || mode === 'week') ? '' : activeDate;

  return (
    <div className="date-navigator">
      <button className="date-nav-btn" onClick={handlePrev} title="Previous day">
        <i className="fas fa-chevron-left"></i>
      </button>

      {PRESETS.map(p => (
        <button
          key={p.id}
          className={`date-nav-preset ${mode === p.id ? 'active' : ''}`}
          onClick={() => handlePreset(p.id)}
        >
          <i className={`fas ${p.icon}`}></i> {p.label}
        </button>
      ))}

      <div className="date-nav-picker">
        <i className="fas fa-calendar-alt"></i>
        <input
          type="date"
          value={pickerValue}
          onChange={handlePickerChange}
        />
      </div>

      <button className="date-nav-btn" onClick={handleNext} title="Next day">
        <i className="fas fa-chevron-right"></i>
      </button>
    </div>
  );
}
