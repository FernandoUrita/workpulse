// ─── PARSE CSV ──────────────────────────────────
export function parseCSV(text) {
  if (!text || !text.trim()) return [];

  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]);
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = parseCSVLine(line);
    const row = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] !== undefined ? values[idx] : '';
    });
    rows.push(row);
  }

  return rows;
}

// ─── PARSE CSV LINE (handles quotes) ────────────
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

// ─── STRINGIFY CSV ──────────────────────────────
export function stringifyCSV(headers, rows) {
  const escape = (val) => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerLine = headers.map(escape).join(',');
  const dataLines = rows.map(row =>
    headers.map(h => escape(row[h])).join(',')
  );

  return [headerLine, ...dataLines].join('\n');
}

// ─── DOWNLOAD CSV ───────────────────────────────
export function downloadCSV(filename, csvContent) {
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ─── MAP TICKET COLUMNS ─────────────────────────
// Auto-detect columns from CSV headers
export function mapCSVToTicket(row) {
  const get = (...keys) => {
    for (const key of keys) {
      const found = Object.keys(row).find(k =>
        k.toLowerCase().replace(/\s+/g, '').includes(key.toLowerCase().replace(/\s+/g, ''))
      );
      if (found && row[found]) return row[found];
    }
    return '';
  };

  return {
    ticketNo: get('Ticket No', 'TicketNo', 'Ticket #', 'No'),
    clientName: get('Client Name', 'Client', 'Company'),
    remarks: get('Remarks', 'Notes', 'Description'),
    subject: get('Subject', 'Title', 'Issue'),
    pendingTo: get('Pending To', 'PendingTo', 'Assigned To'),
    status: get('Status', 'State'),
    timeline: get('Timeline', 'Target Date', 'Due Date'),
    dateCreated: get('Date Created', 'Created', 'Created At'),
    dateLastUpdate: get('Date Last Update', 'Last Update', 'Updated At'),
    category: get('Category', 'Type'),
    priority: get('Priority', 'Urgency'),
  };
}
