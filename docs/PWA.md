# WorkPulse PWA (Phase 2)

## What is included

- Standalone web app manifest, 192/512 PNG icons, maskable icon, Apple touch icon, branded favicon.
- Install button when the browser exposes its install prompt; browser-menu instructions otherwise.
- Connectivity status and an explicit offline-ready indicator.
- Versioned static precache covering every Vite output, including lazy page chunks and the existing Font Awesome CSS/fonts.
- Update notice and user-initiated reload. Other open WorkPulse windows must be closed before activation to protect their forms.
- Netlify headers that revalidate the worker and manifest.

No new dependencies are required. Data/auth remain the existing browser-local implementation. Installing the app does not add cloud synchronization, push notifications, or secure server-backed authentication.

## Build and test

Run from the project root:

    npm run build
    npm run test:pwa
    npm run preview

Use the URL printed by preview. Do not use npm run dev for offline/PWA validation: worker registration is production-only. Service workers require HTTPS or a localhost origin.

1. Load the preview while online and sign in. Wait for Ready for offline use.
2. On Chrome/Edge, check the browser's installation control or Install WorkPulse button if offered. Installation availability is controlled by the browser; embedded and private browsers may not offer it. On iOS, use Safari's Share menu > Add to Home Screen.
3. After readiness, use DevTools Network > Offline, reload /tasks, then navigate to Meetings and Items. Verify the offline status. Create a disposable local test item and reload to check browser-local persistence.
4. Restore online mode. For update testing, keep the preview open, change a visible string, rebuild, then reload/return to the app. Save open forms before pressing Update and reload. A second open tab should block activation until closed.
5. Check light/dark appearance and a narrow viewport.

## Cache behavior

The build script hashes the output and worker template and writes dist/sw.js. Do not edit dist/sw.js directly. An update stays waiting until the user requests it or all old tabs are closed. Known app routes use the cached HTML for consistency with their versioned assets. Other routes, API requests, mutations, and user data are not cached by the worker.

Initial offline preparation requires connectivity to the app and cdnjs for the existing Font Awesome assets. If any required resource fails, installation is rejected and the app offers a retry; the previous working worker remains active. Browser storage may be cleared or evicted by the browser. The offline indicator reflects navigator.onLine, not server availability.

## Verified for this delivery

- Production build and changed-file ESLint passed.
- Six automated tests cover precaching/lazy routes, request bypass, failed installation, cache cleanup, multiple-tab update protection, and icon dimensions.
- Actual browser: sign-in, offline-ready status, responsive dashboard layout, update notice/reload, and Meetings navigation with the preview server stopped passed.
- Actual OS installation and full network-disconnected testing remain manual checks in a supported browser.

## Publish

Review the diff, commit the Phase 2 files, and push your Netlify production branch. Netlify must run npm run build (already configured) so dist/sw.js is generated. For manual deployment, upload the complete dist directory after building.

References:
- https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable
- https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/How_to/Trigger_install_prompt
