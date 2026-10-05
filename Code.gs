// Deploy from Extensions > Apps Script in the RSVP Sheet.
const SHEET_ID = '1S5GFtRiYs1b9NMfweKFs0Fvat6xBinfGqLwFMblLAPw';
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
    const last = sheet.getLastRow();
    if (last > 1 && sheet.getRange(2,2,last-1,1).createTextFinder(id).matchEntireCell(true).findNext()) return reply({status:'success',id:id});
    // Force user input to plain text to prevent spreadsheet formula injection.
    const safe = v => /^[=+\-@\s]/.test(String(v)) ? "'" + v : v;
    sheet.appendRow([new Date().toISOString(),id,name,d.profession,email,mobile,institution,department,'Agreed — summit coordination and event updates'].map(safe));
    SpreadsheetApp.flush();
    return reply({status:'success',id:id});
  } catch (error) {
    return reply({status:'error',message:'Registration could not be saved. Please check the required details and retry.'});
  } finally { if (locked) lock.releaseLock(); }
}
