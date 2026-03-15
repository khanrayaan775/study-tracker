# Study Tracker (Mac app)

Track books and video series progress with daily goals. Built as a native Mac app with Electron.

## First time (after clone)

The repo doesn’t include the built app. Install and build once:

```bash
npm install
npm run electron:build
```

That creates the `dist/` folder and the app inside it. Then use the options below.

## Run the app

**Option A — Use the built app**
- Open `dist/mac-arm64/Study Tracker.app` (only exists after you run `npm run electron:build`).

**Option B — Development (with hot reload)**
```bash
npm run electron:dev
```
Starts the Vite dev server and opens the app window. Edit `src/StudyTracker.jsx` and the app will reload.

**Option C — Run built app from terminal**
```bash
npm run build && npm run electron
```

## Build the Mac app

```bash
npm run electron:build
```
Output: `dist/mac-arm64/Study Tracker.app`. Copy that folder anywhere (e.g. Applications) to use it.

## Data

Data is stored in a JSON file in your Mac user data folder (e.g. `~/Library/Application Support/study-tracker/store.json`).

## Updates

- **v1.2** — Adjust goal (change days to complete, optional “Start from today”), streak (consecutive days of logging), tags (create, color-code, assign to books/series).
- **v1.1** — Date auto-updates after sleep; book notes; full-window theme; today’s quota shows remaining for the day; plan and days remaining on entries; completed items hidden from daily view.
