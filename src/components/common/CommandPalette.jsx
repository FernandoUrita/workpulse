import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAppData } from '../../context/AppDataContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';

const NAV_ITEMS = [
  { id: 'nav-dashboard', group: 'Navigation', label: 'Go to Dashboard', icon: 'fa-th-large', path: '/dashboard' },
  { id: 'nav-tasks', group: 'Navigation', label: 'Go to Tasks', icon: 'fa-tasks', path: '/tasks' },
  { id: 'nav-meetings', group: 'Navigation', label: 'Go to Meetings', icon: 'fa-calendar-alt', path: '/meetings' },
  { id: 'nav-items', group: 'Navigation', label: 'Go to Items', icon: 'fa-box', path: '/items' },
  { id: 'nav-mom', group: 'Navigation', label: 'Go to MOM Templates', icon: 'fa-file-alt', path: '/mom' },
  { id: 'nav-settings', group: 'Navigation', label: 'Go to Settings', icon: 'fa-cog', path: '/settings' },
];

export default function CommandPalette({ open, onClose }) {
  const navigate = useNavigate();
  const { tasks, meetings, items } = useAppData();
  const { theme, toggleTheme } = useTheme();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Reset state when opened
  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      // Focus input after animation frame
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  // Build command list
  const commands = useMemo(() => {
    const list = [];

    // Quick actions
    list.push({
      id: 'action-add-task',
      group: 'Actions',
      label: 'Add new task',
      icon: 'fa-plus-circle',
      action: () => { navigate('/tasks'); onClose(); },
    });
    list.push({
      id: 'action-add-meeting',
      group: 'Actions',
      label: 'Schedule meeting',
      icon: 'fa-calendar-plus',
      action: () => { navigate('/meetings'); onClose(); },
    });
    list.push({
      id: 'action-add-item',
      group: 'Actions',
      label: 'Add new item',
      icon: 'fa-box-open',
      action: () => { navigate('/items'); onClose(); },
    });
    list.push({
      id: 'action-toggle-theme',
      group: 'Actions',
      label: `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`,
      icon: theme === 'dark' ? 'fa-sun' : 'fa-moon',
      action: () => { toggleTheme(); onClose(); },
    });

    // Navigation
    NAV_ITEMS.forEach(n => {
      list.push({
        ...n,
        action: () => { navigate(n.path); onClose(); },
      });
    });

    // Tasks
    tasks.slice(0, 50).forEach(t => {
      list.push({
        id: `task-${t.id}`,
        group: 'Tasks',
        label: t.text,
        sublabel: t.done ? 'Completed' : (t.priority ? `${t.priority} priority` : ''),
        icon: t.done ? 'fa-check-circle' : 'fa-circle',
        action: () => { navigate('/tasks'); onClose(); },
      });
    });

    // Meetings
    meetings.slice(0, 50).forEach(m => {
      list.push({
        id: `meeting-${m.id}`,
        group: 'Meetings',
        label: m.title,
        sublabel: m.date ? `${m.date} ${m.time || ''}`.trim() : '',
        icon: 'fa-calendar-alt',
        action: () => { navigate('/meetings'); onClose(); },
      });
    });

    // Items
    items.slice(0, 50).forEach(i => {
      list.push({
        id: `item-${i.id}`,
        group: 'Items',
        label: i.text || i.title || 'Untitled item',
        sublabel: i.ref || i.status || '',
        icon: 'fa-box',
        action: () => { navigate('/items'); onClose(); },
      });
    });

    return list;
  }, [tasks, meetings, items, theme, navigate, onClose, toggleTheme]);

  // Filter by query
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter(c =>
      c.label.toLowerCase().includes(q) ||
      (c.sublabel && c.sublabel.toLowerCase().includes(q)) ||
      c.group.toLowerCase().includes(q)
    );
  }, [commands, query]);

  // Group filtered results
  const grouped = useMemo(() => {
    const map = new Map();
    filtered.forEach(c => {
      if (!map.has(c.group)) map.set(c.group, []);
      map.get(c.group).push(c);
    });
    return Array.from(map.entries());
  }, [filtered]);

  // Flat list for keyboard nav
  const flatList = useMemo(() => grouped.flatMap(([, items]) => items), [grouped]);

  // Clamp active index
  useEffect(() => {
    if (activeIndex >= flatList.length) {
      setActiveIndex(Math.max(0, flatList.length - 1));
    }
  }, [flatList.length, activeIndex]);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev + 1) % Math.max(1, flatList.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev - 1 + flatList.length) % Math.max(1, flatList.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const cmd = flatList[activeIndex];
      if (cmd) cmd.action();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-cmd-index="${activeIndex}"]`);
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [activeIndex]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="cmd-palette-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
        >
          <motion.div
            className="cmd-palette"
            initial={{ opacity: 0, scale: 0.96, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -12 }}
            transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
          >
            {/* Search input */}
            <div className="cmd-palette-search">
              <i className="fas fa-search"></i>
              <input
                ref={inputRef}
                type="text"
                placeholder="Search tasks, meetings, items, or type a command..."
                value={query}
                onChange={(e) => { setQuery(e.target.value); setActiveIndex(0); }}
                onKeyDown={handleKeyDown}
                autoComplete="off"
                spellCheck="false"
              />
              <kbd className="cmd-palette-kbd">ESC</kbd>
            </div>

            {/* Results */}
            <div className="cmd-palette-list" ref={listRef}>
              {flatList.length === 0 ? (
                <div className="cmd-palette-empty">
                  <i className="fas fa-search"></i>
                  <p>No results for "{query}"</p>
                </div>
              ) : (
                grouped.map(([group, items]) => (
                  <div key={group} className="cmd-palette-group">
                    <div className="cmd-palette-group-label">{group}</div>
                    {items.map(cmd => {
                      const idx = flatList.indexOf(cmd);
                      const isActive = idx === activeIndex;
                      return (
                        <button
                          key={cmd.id}
                          type="button"
                          data-cmd-index={idx}
                          className={`cmd-palette-item ${isActive ? 'active' : ''}`}
                          onMouseEnter={() => setActiveIndex(idx)}
                          onClick={cmd.action}
                        >
                          <i className={`fas ${cmd.icon}`}></i>
                          <div className="cmd-palette-item-text">
                            <span className="cmd-palette-item-label">{cmd.label}</span>
                            {cmd.sublabel && (
                              <span className="cmd-palette-item-sublabel">{cmd.sublabel}</span>
                            )}
                          </div>
                          {isActive && <i className="fas fa-arrow-right cmd-palette-arrow"></i>}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="cmd-palette-footer">
              <span><kbd>↑</kbd><kbd>↓</kbd> Navigate</span>
              <span><kbd>↵</kbd> Select</span>
              <span><kbd>ESC</kbd> Close</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
