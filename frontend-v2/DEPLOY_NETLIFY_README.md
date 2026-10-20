# Deploy PRISM on Netlify (no paid domain required)

## Step 1: Build on your Windows computer
1. In VS Code, open *this folder* containing `package.json`.
2. In the PowerShell terminal, run:

```powershell
npm.cmd install
npm.cmd run build
```

3. Check that a new `dist` folder exists here.

## Step 2: Publish it
1. Sign in to https://app.netlify.com/drop
2. Drag the **`dist` folder** onto the site drop zone.
3. Netlify gives your site a public `https://<site-name>.netlify.app` URL.
4. In the project Overview, click Customize > Manage project name and cover image to choose an available name.

The `public/_redirects` file is automatically copied by Vite to `dist/_redirects`; it ensures direct links such as `/alerts` work on page refresh.

## Step 3: Check phones
Open the live URL on iPhone or Android. On desktop Chrome/Edge, press F12 -> Toggle device toolbar (Ctrl+Shift+M) to test 375, 390, 430 and 768 pixel widths. Check navigation, alerts, maps and sensor tables. Responsive breakpoints already exist; this release adds touch targets and scroll handling but real devices still need visual testing.

## Important
- Demo mode is simulated data. It's **not a certified disaster-warning service**.
- A Vite frontend deployed to Netlify won't automatically make a local FastAPI server or ESP32 publicly reachable. Never expose an unauthenticated device control/API, and don't put secrets in VITE_ environment variables.
- To publish new changes, rebuild and upload the new `dist` folder (or connect a Git repository for automatic builds).
