# Hemoperfusion Summit

Landing page for the Hemoperfusion Summit at SPMC on October 16, 2026.

The page uses a light clinical theme that matches the summit poster.
The hero shows the poster cartridge as parallax layers with a pointer tilt, a scroll tilt, and a blood stream.
The "Inside the cartridge" section explains hemoadsorption in three scroll steps.
The page also has a calendar download and an RSVP form for doctors and nurses.

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
- `dist/summit.css`: layout, theme, phone layout, and motion-off rules
- `dist/app.js`: section reveal, animation switch, and RSVP submission
- `dist/stage.js`: parallax, pointer tilt, scroll steps, canvas particles, and video control
- `dist/assets/cartridge.webp`, `lens.webp`, `bloodwave.webp`, `kidneys.webp`: layers cut from the summit poster
- `dist/assets/logo-spmc.webp`, `logo-skti.webp`: SPMC and SKTI logos
- `dist/assets/flow-loop.mp4`, `adsorb-loop.mp4`: HyperFrames loops, with a poster frame for each
- `dist/llms.txt`: plain summary of the event for AI assistants
- `dist/summit.ics`: 8:00 AM Philippine time calendar reminder
- `videos/flow-loop`, `videos/adsorb-loop`: HyperFrames sources of the two loops
- `Code.gs`: endpoint to deploy in the organizer's Google account

## Render the loops again

Run `npm run check` and `npm run render` in a folder under `videos/`.
Then encode the render into `dist/assets` with `ffmpeg`.

Venue: Mahogany Conference Room, 3rd floor, JICA Building (JICA Outpatient Department / OPD Building), Southern Philippines Medical Center (SPMC). Start: 8:00 AM Philippine time on October 16, 2026. Programme is to be announced. No attendee data or credentials are included.
