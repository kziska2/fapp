import { query, run } from '../db.js';
import { firstOccurrenceOnOrAfter, nextOccurrence } from '../../utils/recurrence.js';
import { upsertMerchant } from './merchants.js';

export function listRecurring(db) {
  return query(db, `
    SELECT r.*, c.label AS category_label, c.type AS category_type
    FROM recurring_expenses r
    LEFT JOIN categories c ON c.id = r.category_id
    ORDER BY r.active DESC, r.next_due_date ASC
  `);
}

export function addRecurring(db, { name, amount, categoryId, necessary, frequency, anchorDay, startDate, endDate, occurrencesTotal }) {
  const nextDue = firstOccurrenceOnOrAfter(startDate, frequency, anchorDay);
  return run(
    db,
    `INSERT INTO recurring_expenses
       (name, amount, category_id, necessary, frequency, anchor_day, start_date, end_date, occurrences_total, occurrences_done, next_due_date, active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 1)`,
    [name, amount, categoryId, necessary, frequency, anchorDay, startDate, endDate || null, occurrencesTotal || null, nextDue]
  );
}

// The schedule itself (frequency/day/start date) is fixed once created — changing
// it after occurrences have already fired risks re-generating ones already logged.
// Delete and re-add for a schedule change; this only ever touches the plan's terms.
export function updateRecurring(db, id, { name, amount, categoryId, necessary, endDate, occurrencesTotal }) {
  run(
    db,
    `UPDATE recurring_expenses SET name = ?, amount = ?, category_id = ?, necessary = ?, end_date = ?, occurrences_total = ? WHERE id = ?`,
    [name, amount, categoryId, necessary, endDate || null, occurrencesTotal || null, id]
  );
}

export function setRecurringActive(db, id, active) {
  run(db, 'UPDATE recurring_expenses SET active = ? WHERE id = ?', [active ? 1 : 0, id]);
}

// Deletes only the rule — expenses it already generated stay in the log like
// any other logged expense (same precedent as deleting a category, docs/DATA_MODEL.md).
export function deleteRecurring(db, id) {
  run(db, 'DELETE FROM recurring_expenses WHERE id = ?', [id]);
}

// Whether a rule is done for reasons other than the user pausing it — hit its
// end date or its occurrence cap. Derived, not stored, so it can't drift out
// of sync with `active`.
export function isRecurringEnded(rule) {
  if (rule.occurrences_total && rule.occurrences_done >= rule.occurrences_total) return true;
  if (rule.end_date && rule.next_due_date > rule.end_date) return true;
  return false;
}

// Runs on every vault unlock/create (VaultContext) — catches up every active
// rule whose next occurrence is due, generating one real expense transaction
// per occurrence (so a phone left untouched for weeks still gets every past
// due date logged, not just the most recent one).
export function materializeDueRecurring(db, today) {
  const due = query(db, 'SELECT * FROM recurring_expenses WHERE active = 1 AND next_due_date <= ?', [today]);
  let created = 0;

  due.forEach((rule) => {
    let nextDue = rule.next_due_date;
    let done = rule.occurrences_done;
    let active = true;

    while (active && nextDue <= today && (!rule.end_date || nextDue <= rule.end_date)) {
      // Matches what typing the rule's name into the Detail field of a manual
      // expense would produce — same merchant record, same look in the running list.
      const merchantId = upsertMerchant(db, rule.name, nextDue);
      run(
        db,
        `INSERT INTO transactions (date, type, amount, category_id, merchant_id, necessary, recurring_id)
         VALUES (?, 'expense', ?, ?, ?, ?, ?)`,
        [nextDue, rule.amount, rule.category_id, merchantId, rule.necessary, rule.id]
      );
      created += 1;
      done += 1;
      if (rule.occurrences_total && done >= rule.occurrences_total) { active = false; break; }
      nextDue = nextOccurrence(nextDue, rule.frequency, rule.anchor_day);
    }

    if (rule.end_date && nextDue > rule.end_date) active = false;

    run(
      db,
      'UPDATE recurring_expenses SET next_due_date = ?, occurrences_done = ?, active = ? WHERE id = ?',
      [nextDue, done, active ? 1 : 0, rule.id]
    );
  });

  return created;
}
