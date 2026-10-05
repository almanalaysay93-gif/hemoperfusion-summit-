// Deploy from Extensions > Apps Script in the RSVP Sheet.
const SHEET_ID = '1S5GFtRiYs1b9NMfweKFs0Fvat6xBinfGqLwFMblLAPw';
const NOTIFICATION_RECIPIENTS = 'almanalaysay93@gmail.com,share@spmcdvo.net';
const NOTIFICATION_HEADERS = ['Email notification', 'Email sent at', 'Email error', 'Attendee email', 'Attendee email sent at', 'Attendee email error'];
function doPost(e) {
  const reply = value => ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
  let locked = false;
  const lock = LockService.getScriptLock();
  try {
    if (!e || !e.postData || e.postData.contents.length > 5000) throw new Error('Invalid submission.');
    const d = JSON.parse(e.postData.contents);
    const text = (key, max, required) => {
      if (typeof d[key] !== 'string' || d[key].length > max || (required && !d[key].trim())) throw new Error('Please complete all required details.');
      return d[key].trim();
    };
    if (d.website) throw new Error('Invalid submission.');
    const id = text('id', 36, true);
    if (!/^[a-f0-9-]{36}$/.test(id)) throw new Error('Invalid registration reference.');
    const name = text('name',120,true), email = text('email',180,true), mobile = text('mobile',30,true), institution = text('institution',180,true), department = text('department',120,false);
    if (!['Doctor','Nurse'].includes(d.profession) || d.consent !== true || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || mobile.length < 7) throw new Error('Please check your details and consent.');
    lock.waitLock(15000); locked = true;
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('Registrations');
    if (!sheet) throw new Error('Registration sheet is unavailable.');
    ensureNotificationColumns(sheet);
    const last = sheet.getLastRow();
    if (last > 1 && sheet.getRange(2,2,last-1,1).createTextFinder(id).matchEntireCell(true).findNext()) return reply({status:'success',id:id});
    // Force user input to plain text to prevent spreadsheet formula injection.
    const safe = v => /^[=+\-@\s]/.test(String(v)) ? "'" + v : v;
    sheet.appendRow([new Date().toISOString(),id,name,d.profession,email,mobile,institution,department,'Agreed — summit coordination and event updates','Pending','','','Pending','',''].map(safe));
    SpreadsheetApp.flush();
    // Email failure must never lose or reject an already saved RSVP.
    sendRegistrationNotification(sheet, sheet.getLastRow());
    sendAttendeeConfirmation(sheet, sheet.getLastRow());
    return reply({status:'success',id:id});
  } catch (error) {
    return reply({status:'error',message:'Registration could not be saved. Please check the required details and retry.'});
  } finally { if (locked) lock.releaseLock(); }
}


function ensureNotificationColumns(sheet) {
  if (sheet.getMaxColumns() < 15) sheet.insertColumnsAfter(sheet.getMaxColumns(), 15 - sheet.getMaxColumns());
  const range = sheet.getRange(1, 10, 1, 6);
  const current = range.getValues()[0];
  if (current.some((value, i) => value && value !== NOTIFICATION_HEADERS[i])) {
    throw new Error('Columns J:O must be reserved for RSVP notification status.');
  }
  range.setValues([NOTIFICATION_HEADERS]);
}

function sendRegistrationNotification(sheet, row) {
  const values = sheet.getRange(row, 1, 1, 12).getValues()[0];
  if (values[9] !== 'Pending') return;
  try {
    if (MailApp.getRemainingDailyQuota() < 2) throw new Error('Daily email quota exhausted; queued for retry.');
    MailApp.sendEmail({
      to: NOTIFICATION_RECIPIENTS,
      subject: 'New RSVP — Hemoperfusion Summit 2026',
      body: [
        'A new RSVP has been recorded for the Hemoperfusion Summit at SPMC on October 16, 2026.',
        '',
        'Submitted at: ' + values[0],
        'Registration ID: ' + values[1],
        'Full name: ' + values[2],
        'Profession: ' + values[3],
        'Email: ' + values[4],
        'Mobile number: ' + values[5],
        'Hospital / institution: ' + values[6],
        'Department / specialty: ' + (values[7] || 'Not provided'),
        '',
        'Registration Sheet: https://docs.google.com/spreadsheets/d/' + SHEET_ID + '/edit',
        '',
        'Use these details only for summit coordination and event updates.'
      ].join('\n'),
      name: 'Hemoperfusion Summit RSVP'
    });
    sheet.getRange(row, 10, 1, 3).setValues([['Sent', new Date().toISOString(), '']]);
  } catch (error) {
    // Retain Pending so the scheduled automation can retry safely.
    sheet.getRange(row, 12).setValue(String(error.message || 'Email could not be sent.').slice(0, 300));
    console.warn('RSVP email notification queued for retry at row ' + row);
  }
}

// Run this ONCE in the Apps Script editor and approve Google's permissions.
// It installs one five-minute retry trigger and authorizes email sending.
function setupRsvpNotifications() {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('Registrations');
  if (!sheet) throw new Error('Registrations sheet is missing.');
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    ensureNotificationColumns(sheet);
    MailApp.getRemainingDailyQuota();
    if (!ScriptApp.getProjectTriggers().some(t => t.getHandlerFunction() === 'retryPendingNotifications')) {
      ScriptApp.newTrigger('retryPendingNotifications').timeBased().everyMinutes(5).create();
    }
  } finally { lock.releaseLock(); }
}

function retryPendingNotifications() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) return;
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('Registrations');
    if (!sheet || sheet.getLastRow() < 2) return;
    const pending = sheet.getRange(2, 10, sheet.getLastRow() - 1, 6).getValues();
    let processed = 0;
    for (let i = 0; i < pending.length && processed < 20; i++) {
      if (pending[i][0] === 'Pending' || pending[i][3] === 'Pending') {
        if (MailApp.getRemainingDailyQuota() < 1) break;
        if (pending[i][0] === 'Pending' && MailApp.getRemainingDailyQuota() >= 2) sendRegistrationNotification(sheet, i + 2);
        if (pending[i][3] === 'Pending' && MailApp.getRemainingDailyQuota() >= 1) sendAttendeeConfirmation(sheet, i + 2);
        processed++;
      }
    }
  } finally { lock.releaseLock(); }
}


function sendAttendeeConfirmation(sheet, row) {
  const values = sheet.getRange(row, 1, 1, 15).getValues()[0];
  if (values[12] !== 'Pending') return;
  try {
    if (MailApp.getRemainingDailyQuota() < 1) throw new Error('Daily email quota exhausted; queued for retry.');
    // Read plain email and name, removing the sheet's plain-text escape if present.
    const plain = value => String(value || '').replace(/^'/, '');
    const email = plain(values[4]);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Invalid attendee email address.');
    MailApp.sendEmail({
      to: email,
      replyTo: 'almanalaysay93@gmail.com',
      subject: 'Your RSVP is confirmed — Hemoperfusion Summit 2026',
      name: 'Hemoperfusion Summit RSVP',
      body: [
        'Hello ' + plain(values[2]) + ',',
        '',
        'Thank you for registering for the Hemoperfusion Summit 2026! Your RSVP has been recorded and confirmed.',
        '',
        'Date: Friday, October 16, 2026',
        'Venue: SPMC',
        'Exact room and start time: To be announced',
        'Registration reference: ' + values[1],
        '',
        'We look forward to welcoming you for a gathering focused on advancing blood purification through hemoadsorption.',
        '',
        'Please keep this email for your reference. If you need to correct your details or cancel your RSVP, reply to this email.',
        '',
        'Thank you,',
        'Hemoperfusion Summit Organizers'
      ].join('\n')
    });
    sheet.getRange(row, 13, 1, 3).setValues([['Sent', new Date().toISOString(), '']]);
  } catch (error) {
    sheet.getRange(row, 15).setValue(String(error.message || 'Confirmation could not be sent.').slice(0, 300));
    console.warn('Attendee confirmation queued for retry at row ' + row);
  }
}
