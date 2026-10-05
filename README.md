# Hemoperfusion Summit

Landing page for the Hemoperfusion Summit at SPMC on October 16, 2026.

Light blue glassmorphism design, organizer-provided SPMC/SKTI header and page background, animations, responsive layouts, calendar download, and an RSVP form for doctors and nurses.

## Preview locally

No build step or dependencies required. From the repository root:

```sh
python3 -m http.server 8000 --directory dist
```

Open http://localhost:8000 in your browser. Publish the `dist/` directory using any static website host.

## Google Sheets RSVP

RSVP saving is currently inactive. Follow `GOOGLE-SHEETS-SETUP.md` to deploy `Code.gs` as a Google Apps Script web app. Set its deployed `/exec` URL in `dist/config.js` and redeploy the site. Keep the registration Sheet private.

The form reports success only after the endpoint confirms saving. The script validates inputs, requires consent, prevents duplicate registration IDs, and protects against spreadsheet formula injection.

## Files

- `dist/index.html`: page content and registration form
- `dist/style.css`, `dist/glass.css`: responsive layout and light glass theme
- `dist/app.js`: animation controls and RSVP submission
- `dist/assets/summit-header.jpg`: supplied landscape header including both logos
- `dist/assets/summit-background.jpg`: supplied page background
- `dist/mobile.css`: phone layout and background styling
- `dist/summit.ics`: 8:00 AM Philippine time calendar reminder
- `Code.gs`: endpoint to deploy in the organizer's Google account

Venue: Mahogany Room, 3rd floor, JAICA Building, SPMC. Start: 8:00 AM Philippine time on October 16, 2026. Programme is to be announced. No attendee data or credentials are included.
