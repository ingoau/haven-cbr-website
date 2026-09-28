# Haven Canberra

Landing page for **Hack Club Haven Canberra**, a free game jam for teens aged 13–18 (Nov 14–15).
It rebuilds [haven.hackclub.com/canberra](https://haven.hackclub.com/canberra) with a more responsive layout.

It's a static site with no build step: `index.html`, `css/style.css`, `js/main.js`, plus `images/`, `fonts/` and `events.json`.

## Run locally

```sh
npx http-server -c-1 .
# or: python3 -m http.server
```

Then open http://localhost:8080. `events.json` is loaded with `fetch`, so opening the file directly from disk won't work.

## Features

- A sign-up form in the hero and another after the FAQ. Both post to `forms.hackclub.com/haven-signup` using the Canberra event ID.
- A live Leaflet/OpenStreetMap map of all Haven events, centred on Canberra. It can be expanded to full screen.
- A countdown to the event and an "Add to calendar" link that downloads an `.ics` file.
- The "how it works" steps are real HTML with photos, not one baked-in image, so the text reflows at any width.
- Past-event videos open in a lightbox. The FAQ is an accordion built on native `<details>`.
- On mobile, a sticky "Sign up" button appears whenever neither sign-up form is on screen.
- Reduced-motion support, a skip link, keyboard focus styles, and no horizontal scrolling from 320px up.

## Editing

- Event details (dates, location) are in the hero markup in `index.html` and the `EVENT` constant in `js/main.js`.
- The map data is `events.json`, an array of `[name, lat, lng, slug]` entries.
- Artwork comes from the Haven site. The step photos in `images/steps/photos/` were cropped from the original notebook illustration.
