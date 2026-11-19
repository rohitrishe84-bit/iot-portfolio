# Rohit Rishe · IoT Portfolio

Five ESP32 / IoT assignments presented as a static site: plain HTML, CSS and
JavaScript. No framework, no packages, no build step.

## Run locally

From this folder:

```bash
python -m http.server 5173
```

Open http://localhost:5173. Any static file server works (for example `npx serve .`).

## Structure

```
rohit-rishe-portfolio/
├── index.html               Home: hero + serial monitor, assignment case studies, comparison matrix, tech stack
├── assignment-01.html       ESP32 Web Server & HTML LED Control
├── assignment-02.html       Adafruit IO Dashboard & MQTT LED Control
├── assignment-03.html       IFTTT + Adafruit IO IoT Automation
├── assignment-04.html       Firebase IoT Environment Monitoring Platform
├── assignment-05.html       Firebase-Based Home Automation
├── css/styles.css           Tokens, layout, components, responsive rules, motion
├── js/main.js               All interactive behaviour (see below)
└── assets/
    ├── favicon.svg
    ├── images/              a01-… to a04-… project photos and dashboard screenshots
    └── videos/              a01/a02/a03 demos, a05 baseline demo
```

## Features

- Sticky header, top reading-progress bar, active-section highlighting, accessible mobile menu (Esc / outside tap closes it)
- Serial Monitor hero that replays the `Serial.println()` messages from the Assignment 01–03 sketches (Replay button; static when reduced motion is on)
- Case-study rows: whole-row click target, "View project" and "Watch demo" / "View images" buttons, signal path from each write-up
- Comparison matrix that turns into labelled cards on small screens
- Detail pages: signal-path summary, sticky section tabs with scrollspy, breadcrumbs, previous/next navigation
- Code viewer: Arduino C++ / JSON / tree highlighting, line numbers, Copy, Show all / Collapse for long sketches
- Collapsible repository-structure blocks
- Lightbox: full size, thumbnails, ←/→/Esc keys, swipe, focus trap
- Videos with native controls and a first-frame preview; starting one pauses the others
- Back-to-top button with a progress ring; respects `prefers-reduced-motion`

## Deploy

**Vercel:** import the folder or its Git repository as a new project, set Framework Preset to
*Other*, leave the build command empty, and set the output directory to `.`.

**GitHub Pages:** push the folder's contents to a repository, then choose
Settings → Pages → *Deploy from a branch* → `main` / `(root)`. Every path is relative,
so the site also works under a project sub-path such as `username.github.io/repo/`.
