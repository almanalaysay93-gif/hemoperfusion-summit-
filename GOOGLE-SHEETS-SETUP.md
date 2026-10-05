# Activate RSVP collection

Your Google Sheet is already created in the ChatGPT folder of almanalaysay93@gmail.com:
https://docs.google.com/spreadsheets/d/1S5GFtRiYs1b9NMfweKFs0Fvat6xBinfGqLwFMblLAPw/edit

1. Open that Sheet while signed in as almanalaysay93@gmail.com.
2. Choose **Extensions → Apps Script**.
3. Replace the default code with the contents of `Code.gs` provided beside this file, then save.
4. Select `setupRsvpNotifications` in the editor and click **Run**. Authorize access to the Sheet, email sending, and scheduled triggers. This installs one five-minute retry trigger without sending any email or notifying past registrations.
5. Select **Deploy → New deployment → Web app**.
6. Set **Execute as: Me** and **Who has access: Anyone**, so doctors and nurses can submit without a Google login. This makes only the submission endpoint accessible; keep the Sheet private.
7. Click **Deploy** and authorize the script to access your Sheet. Read Google's authorization screen before accepting.
8. Copy the deployed **Web app URL**, ending in `/exec`, and send it back here. I will connect it to the page and verify a clearly labelled test registration.

Until that URL is connected, the page does not save or claim to save RSVP details. Do not distribute it as an active registration link yet. The programme is to be announced.

For later code changes, update the deployment to a new version. A `/dev` test URL is not suitable for attendees.


## Email notifications

Each new RSVP saved by this endpoint sends one notification to both **almanalaysay93@gmail.com** and **share@spmcdvo.net**, including the registration details and Sheet link. Google sends it from the account running the deployment. Columns J:O track Pending/Sent status, sent time, and errors. Reserve these columns for the script.

If email fails or the daily quota is exhausted, the RSVP remains saved and the five-minute trigger retries pending notifications. Repeated submissions of the same registration ID do not create another row or email. An interruption after Google accepts an email but before status is recorded can cause a retry email; the registration ID lets you identify it.

For an existing deployment: replace `Code.gs`, run `setupRsvpNotifications` once, then **Deploy → Manage deployments → Edit (pencil) → Version: New version → Deploy**. Keep the existing `/exec` URL. Authorize the new email permissions when prompted.

These notifications apply to the website's RSVP endpoint, not arbitrary manual edits or a separate Google Form. Test with a clearly labelled RSVP after the endpoint is connected, check both inboxes and the Sheet's email status. No live notification has been tested yet.


## Attendee confirmation

New registrations also receive a thank-you and RSVP confirmation at their submitted email, including the event date, venue, registration reference, and reply address for corrections or cancellation. Venue: Mahogany Room, 3rd floor, JAICA Building, SPMC. Start: 8:00 AM Philippine time. This email never includes the private registration Sheet link or other attendees' details.

Organizer delivery is tracked in J:L; attendee delivery in M:O. Each is retried independently. Reserve J:O for the automation. Replace the code, run `setupRsvpNotifications` to initialize the additional headers, and deploy a new version. Existing registrations are not automatically emailed unless their attendee status is explicitly set to Pending.
