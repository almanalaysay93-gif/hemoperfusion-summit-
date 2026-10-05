# Activate RSVP collection

Your Google Sheet is already created in the ChatGPT folder of almanalaysay93@gmail.com:
https://docs.google.com/spreadsheets/d/1S5GFtRiYs1b9NMfweKFs0Fvat6xBinfGqLwFMblLAPw/edit

1. Open that Sheet while signed in as almanalaysay93@gmail.com.
2. Choose **Extensions → Apps Script**.
3. Replace the default code with the contents of `Code.gs` provided beside this file, then save.
4. Select **Deploy → New deployment → Web app**.
5. Set **Execute as: Me** and **Who has access: Anyone**, so doctors and nurses can submit without a Google login. This makes only the submission endpoint accessible; keep the Sheet private.
6. Click **Deploy** and authorize the script to access your Sheet. Read Google's authorization screen before accepting.
7. Copy the deployed **Web app URL**, ending in `/exec`, and send it back here. I will connect it to the page and verify a clearly labelled test registration.

Until that URL is connected, the page does not save or claim to save RSVP details. Do not distribute it as an active registration link yet. The time, exact room, and programme are marked to be announced.

For later code changes, update the deployment to a new version. A `/dev` test URL is not suitable for attendees.
