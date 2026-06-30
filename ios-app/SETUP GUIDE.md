# Park Moments iOS — Setup Guide

Everything you need to build and test the iOS app on your Mac (no Apple Developer account required for simulator testing).

---

## Prerequisites

- **Mac** (required — iOS apps can only be built on macOS)
- **Xcode** — free from the Mac App Store. Get the latest version (15 or 16).
  After installing, open it once and let it finish setting up command-line tools.

---

## Step 1 — Create the Xcode project

1. Open Xcode → **Create New Project**
2. Choose **iOS → App** → Next
3. Fill in:
   - **Product Name:** `ParkMoments`
   - **Team:** None (leave blank for now)
   - **Organization Identifier:** anything, e.g. `com.yourname`
   - **Interface:** SwiftUI
   - **Language:** Swift
4. Save the project **anywhere on your Mac** (not inside the `rope-drop 29` folder — keep it separate).

---

## Step 2 — Replace the default Swift files

Xcode creates `ContentView.swift` and a `<YourApp>App.swift` by default. Replace them:

1. In Xcode's Project Navigator (left sidebar), **delete** the auto-generated `ContentView.swift` and `ParkMomentsApp.swift` (move to Trash when prompted).
2. Drag the three `.swift` files from the `ios-app` folder into the Project Navigator, **into the ParkMoments group**:
   - `ParkMomentsApp.swift`
   - `ContentView.swift`
   - `WebView.swift`
3. In the dialog that appears, make sure **"Copy items if needed"** is checked, and **"Add to target: ParkMoments"** is checked → Finish.

---

## Step 3 — Add the web files

This is the key step — your HTML/CSS/JS need to be bundled inside the app.

1. In Finder, go to your `rope-drop 29` folder.
2. Create a folder called `www` inside it (if it doesn't exist already).
3. Copy into `www/`:
   - `index.html`
   - `css/` folder
   - `js/` folder
   - `assets/` folder (if you have one)

   So the structure inside `www/` should look like:
   ```
   www/
   ├── index.html
   ├── css/
   │   └── style.css
   └── js/
       ├── app.js
       ├── badges.js
       ├── collections.js
       ├── data.js
       ├── map-data.js
       ├── ride-details.js
       ├── secretmenu.js
       ├── storage.js
       ├── trivia.js
       └── waittimes.js
   ```

4. Back in Xcode: drag the **`www` folder** from Finder into the Project Navigator (inside the ParkMoments group).
5. In the dialog:
   - ✅ **"Copy items if needed"** — checked
   - Under "Added folders" → select **"Create folder references"** (not "Create groups") — **this is important**, it keeps the folder structure intact
   - ✅ **"Add to target: ParkMoments"** — checked
   - Click Finish.

The `www` folder should appear in the navigator with a **blue folder icon** (not yellow). Blue = folder reference, which is correct.

---

## Step 4 — Run on the Simulator

1. At the top of Xcode, click the device picker (next to the play button) and choose any iPhone simulator, e.g. **iPhone 16**.
2. Press **⌘R** (or the ▶ play button).
3. The app will build and launch in the iOS Simulator. You should see Park Moments load.

**First launch may take 10–30 seconds** as Xcode compiles everything.

---

## Step 5 — Run on your own iPhone (optional, no paid account needed)

You can test on your real device for free with a personal team:

1. Plug in your iPhone with a USB cable.
2. In Xcode, select your iPhone from the device picker.
3. Go to **Xcode → Settings → Accounts** → add your Apple ID (the same one you use for the App Store). This is free.
4. In the project settings (click the blue `ParkMoments` icon at the top of the navigator) → **Signing & Capabilities** tab → set Team to your personal Apple ID.
5. Press **⌘R**. Xcode will ask you to trust the developer certificate on your phone:
   - On your iPhone: **Settings → General → VPN & Device Management → your Apple ID → Trust**
6. The app installs and runs. Apps installed this way expire after 7 days (free tier limit), but you can just rebuild to renew.

---

## Notes

### Data / localStorage
Your trip data lives in `localStorage`, which WKWebView persists in the app's sandboxed storage — it survives app restarts and works exactly as it does in Safari. No changes needed to `storage.js`.

### Fonts (offline caveat)
The web app loads DM Sans from Google Fonts via a CDN link. When the device has no internet connection, the font won't load and the system font is used as a fallback — the app still works perfectly, it just looks slightly different. To make fonts truly offline, you can download the font files and add them to the `www/` folder later (not required now).

### Leaflet / jsPDF (CDN scripts)
Same story: the Leaflet map and jsPDF are loaded from cdnjs. They'll be unavailable offline. If you want full offline support for the map, we can bundle those JS files into `www/js/` — easy to do later.

### What's next (when you're ready to go more native)
- **App icon** — add one in `Assets.xcassets`
- **Splash screen** — add a Launch Screen storyboard or SwiftUI launch screen
- **Push notifications** — add a native Swift `UNUserNotificationCenter` layer; call it from JS via `WKScriptMessageHandler`
- **Haptics** — bridge `UIImpactFeedbackGenerator` from JS
- **Share sheet** — native `UIActivityViewController` triggered from a JS message
- **Offline fonts + scripts** — bundle them in `www/` and remove CDN links
