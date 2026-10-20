# PRISM / FIELD INTELLIGENCE — NEW FRONTEND

**A separate, redesigned React + TypeScript frontend**, inspired by the supplied Make-a-Thon '26 field-map poster (bold type, orange alert markers, survey grids, contour-line maps). This is a *new folder* — no original PRISM files have been edited or replaced.

> **Prototype only.** All Demo readings, stations and risk values are illustrative simulation data. PRISM is not a certified emergency warning service. Ground-motion anomalies cannot predict earthquakes.

## Windows / VS Code — start here

1. **Extract** `PRISM_Field_UI_New.zip` anywhere (for example, `Downloads`).
2. In **VS Code → File → Open Folder**, open the extracted **`PRISM-Field-UI-New`** folder — the folder containing `package.json`.
3. Select **Terminal → New Terminal**. Run these commands **one at a time** (or double-click `START_PRISM_WINDOWS.bat` inside the extracted folder for an automatic Windows start):

```powershell
Copy-Item .env.example .env
npm.cmd install
npm.cmd run dev
```

4. Open the **Local** URL printed by Vite (usually `http://localhost:5173/`). If the original PRISM frontend is already running on port `5173`, stop it using **Ctrl+C** first, or open the alternate port Vite prints (for example `5174`).
5. Keep the terminal running. **Demo mode** works with no backend and no ESP32.

The old frontend remains a separate project. You can keep both folders and switch between them. You can later request a *design-only port* into the original frontend if you provide its actual source code.

## What the new UI includes

| Route | Implemented interactions |
| --- | --- |
| `/` | Functional dropdown for 8 scenarios; tactile overview map with clickable stations; risk dial; five selectable hazard tiles; seven sensor readouts; trend graph and activity feed |
| `/monitor` | Sensor/site filters; 15m, 1h, 6h, 24h, custom-range controls; stats; synthetic trend charts; sensor-quality table; refresh |
| `/risk` | Five hazard selectors; risk breakdowns, observations, suggestions, comparisons and ground-motion safety statement |
| `/map` | Real OpenStreetMap/Leaflet tiles, station pins, tooltips/popups, drag and zoom; station/deployment/risk filters, inspector panel |
| `/reports` | Date/site/hazard/severity filters; summaries, visual distribution, trend, print layout and CSV export |
| `/events` | Search, category/severity/time filtering, detail dialog, pagination, CSV export with original timestamps |
| `/alerts` | Active/acknowledged/resolved workflow; detail dialogs; test alerts; acknowledge/resolve with confirmation; simulated notification labels |
| `/settings` | Demo or provisional Live mode, API URL, backend health check, polling interval, density and default station preferences |

The dashboard is responsive, supports keyboard focus, uses an original schematic topo-map for the overview, and offers a separate interactive geographic map. Preferences are saved in browser `localStorage`.

## Demo presets

1. Normal conditions
2. Rising rainfall and water level
3. Slope instability
4. Urban drainage flooding
5. Abnormal ground vibration (not earthquake prediction)
6. Missing / disconnected sensors
7. Multi-hazard escalation
8. Alert workflow exercise

Presets are deterministic (same values given a selected preset), **not real-world measurements**. Changing scenarios resets test alerts and simulated operator history. Demo actions never send SMS, email, push notifications or public warnings.

## Backend notes / known constraints

This new codebase has only the **README** for the previous app, not the source tree or `API_CONTRACT.md`. Therefore, feature intent is represented, but **no claim of source-code parity or backend contract compatibility is possible**.

In **Settings → Live backend API**, the provisional typed adapter expects:

- `/health`
- `/api/v1/sites`
- `/api/v1/readings/latest`
- `/api/v1/risk/current`
- `/api/v1/alerts`
- `/api/v1/events`
- `/api/v1/readings/history` (optional)

It expects arrays, `{items:[...]}`, `{data:[...]}` or `{results:[...]}`; it maps site IDs, coordinates, risk IDs/scores, reading values/times, alerts and events. Fields in the actual backend may differ: **review and adapt `src/api.ts` before using Live mode**. Live mode shows errors and never silently fills invalid readings with Demo values. Live alert write commands and real notification delivery are intentionally unavailable without a secure documented server contract.

Map tiles and fonts may need internet; fallbacks are provided for fonts. Do not store API secrets in `VITE_` variables — these are visible to browsers.

Risk bands are for illustration: 0–30 NORMAL, 31–50 WATCH, 51–75 WARNING, 76–100 CRITICAL. Overall score = max valid hazard score; this is **not** the probability of a disaster.

## Files

- `src/main.tsx` — routes and root
- `src/ui.tsx` — shared shell, reusable display widgets, original illustrated map
- `src/pages.tsx` — all eight routes
- `src/store.tsx` — central Demo/Live state, settings, alert actions
- `src/demo.ts` — eight training scenarios and station/sensor values
- `src/api.ts` — provisional typed backend adapter
- `src/model.ts` — types, thresholds, CSV export
- `src/style.css` — fully redesigned visual system and mobile breakpoints
- `public/design-reference.png` — supplied design-reference image (not displayed as a fake UI screenshot)

## Development commands

```powershell
npm.cmd run dev
npm.cmd run test:demo
npm.cmd run build
npm.cmd run preview
```

**Verification note:** Static TypeScript/TSX syntax was validated and the route/scenario presence check passed in the creation environment. Full `npm install`, browser UX testing and production build could not be performed there because the npm registry was inaccessible. Please run the commands above on your Windows computer; send any errors for assistance.
