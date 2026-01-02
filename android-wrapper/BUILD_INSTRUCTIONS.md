# Build instructions (TWA using Bubblewrap)

Prereqs:
- Node.js and npm
- Java JDK (11+), Android SDK/Platform tools
- `npx @bubblewrap/cli`

Steps:

1. Build web assets

```bash
npm install
npm run build
```

2. Deploy `dist/` to a public URL (or expose locally with ngrok/localtunnel during dev).

3. Initialize bubblewrap

```bash
npx @bubblewrap/cli init --manifest=https://your-site/manifest.json
# Provide package id (e.g. com.yourcompany.zxaios), app name, icons, etc.
```

4. Build the APK

```bash
npx @bubblewrap/cli build
# The generated APK will be in ./output
```

5. Make the app selectable as Launcher
- Bubblewrap's generated manifest can be edited to include the `HOME` intent-filter (see AndroidManifest.example.xml).

6. Signing (release)
- Use keytool/jarsigner or configure signing in Bubblewrap prompts / gradle signing config.

Notes:
- For deeper integration with Termux, implement a native module that exposes commands to the WebView via `addJavascriptInterface` (Android) or `MethodChannel` (Flutter).
- If you prefer Flutter wrapper instead of TWA, I can scaffold a minimal Flutter project that loads the SPA in a WebView and exposes a `MethodChannel` for the linux bridge.
