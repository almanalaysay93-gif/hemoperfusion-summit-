// Deploy from Extensions > Apps Script in the RSVP Sheet.
const SHEET_ID = '1S5GFtRiYs1b9NMfweKFs0Fvat6xBinfGqLwFMblLAPw';
const NOTIFICATION_RECIPIENTS = 'almanalaysay93@gmail.com,share@spmcdvo.net';
const NOTIFICATION_HEADERS = ['Email notification', 'Email sent at', 'Email error'];
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
    sheet.appendRow([new Date().toISOString(),id,name,d.profession,email,mobile,institution,department,'Agreed — summit coordination and event updates','Pending','',''].map(safe));
    SpreadsheetApp.flush();
    // Email failure must never lose or reject an already saved RSVP.
    sendRegistrationNotification(sheet, sheet.getLastRow());
    return reply({status:'success',id:id});
  } catch (error) {
    return reply({status:'error',message:'Registration could not be saved. Please check the required details and retry.'});
  } finally { if (locked) lock.releaseLock(); }
}


function ensureNotificationColumns(sheet) {
  if (sheet.getMaxColumns() < 12) sheet.insertColumnsAfter(sheet.getMaxColumns(), 12 - sheet.getMaxColumns());
  const range = sheet.getRange(1, 10, 1, 3);
  const current = range.getValues()[0];
  if (current.some((value, i) => value && value !== NOTIFICATION_HEADERS[i])) {
    throw new Error('Columns J:L must be reserved for RSVP notification status.');
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
    const pending = sheet.getRange(2, 10, sheet.getLastRow() - 1, 1).getValues();
    let processed = 0;
    for (let i = 0; i < pending.length && processed < 20; i++) {
      if (pending[i][0] === 'Pending') {
        if (MailApp.getRemainingDailyQuota() < 2) break;
        sendRegistrationNotification(sheet, i + 2);
        processed++;
      }
    }
  } finally { lock.releaseLock(); }
}
