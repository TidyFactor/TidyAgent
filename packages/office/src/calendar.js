/**
 * @file packages/office/src/calendar.js
 * Calendar, Deadlines & Event Manager for @tidy/office
 */

const crypto = require('crypto');
const { getDb } = require('./core-bridge');
const { initOfficeSchema } = require('./schema');

function generateId(prefix = 'evt') {
  return `${prefix}_${Date.now().toString(36)}_${crypto.randomBytes(3).toString('hex')}`;
}

function ensureSchema() {
  const db = getDb();
  initOfficeSchema(db);
  return db;
}

function addEvent({
  title,
  eventType = 'deadline',
  relatedEntityType = null,
  relatedEntityId = null,
  startTime,
  endTime = null,
  isCompleted = false
}) {
  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    throw new Error('Event title is required.');
  }
  if (!startTime) {
    throw new Error('Event startTime is required.');
  }

  const db = ensureSchema();
  const id = generateId('evt');
  const validTypes = ['meeting', 'deadline', 'invoice_due', 'milestone', 'followup'];
  const cleanType = validTypes.includes(eventType) ? eventType : 'deadline';

  const stmt = db.prepare(`
    INSERT INTO app_calendar_events (
      id, title, event_type, related_entity_type, related_entity_id,
      start_time, end_time, is_completed
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    title.trim(),
    cleanType,
    relatedEntityType,
    relatedEntityId,
    startTime,
    endTime,
    isCompleted ? 1 : 0
  );

  return getEvent(id);
}

function getEvent(id) {
  if (!id) return null;
  const db = ensureSchema();
  return db.prepare('SELECT * FROM app_calendar_events WHERE id = ?').get(id) || null;
}

function listEvents({ eventType = null, startDate = null, endDate = null, limit = 100 } = {}) {
  const db = ensureSchema();
  let sql = 'SELECT * FROM app_calendar_events WHERE 1=1';
  const params = [];

  if (eventType) {
    sql += ' AND event_type = ?';
    params.push(eventType);
  }
  if (startDate) {
    sql += ' AND start_time >= ?';
    params.push(startDate);
  }
  if (endDate) {
    sql += ' AND start_time <= ?';
    params.push(endDate);
  }

  sql += ' ORDER BY start_time ASC LIMIT ?';
  params.push(limit);

  return db.prepare(sql).all(...params);
}

function getUpcomingDeadlines(daysAhead = 7) {
  const db = ensureSchema();
  const now = new Date().toISOString();
  const future = new Date();
  future.setDate(future.getDate() + daysAhead);
  const futureStr = future.toISOString();

  // Pull upcoming calendar deadlines
  const events = db.prepare(`
    SELECT * FROM app_calendar_events
    WHERE is_completed = 0 AND start_time BETWEEN ? AND ?
    ORDER BY start_time ASC
  `).all(now, futureStr);

  // Pull upcoming invoice due dates
  const todayDate = now.split('T')[0];
  const futureDate = futureStr.split('T')[0];
  const pendingInvoices = db.prepare(`
    SELECT i.id, i.invoice_number, i.total_amount, i.currency, i.due_date, c.name as client_name
    FROM app_invoices i
    LEFT JOIN app_crm_clients c ON i.client_id = c.id
    WHERE i.status = 'pending' AND i.due_date BETWEEN ? AND ?
    ORDER BY i.due_date ASC
  `).all(todayDate, futureDate);

  return {
    events,
    pendingInvoices
  };
}

function deleteEvent(id) {
  if (!id) return false;
  const db = ensureSchema();
  const res = db.prepare('DELETE FROM app_calendar_events WHERE id = ?').run(id);
  return res.changes > 0;
}

module.exports = {
  addEvent,
  getEvent,
  listEvents,
  getUpcomingDeadlines,
  deleteEvent
};
