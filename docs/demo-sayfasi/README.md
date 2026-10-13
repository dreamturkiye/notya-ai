# Screenshots not included

The brief for NOTYA-ULKE-DEMO-01 (this branch, `feat/ulke-demo-sayfasi`) asked for screenshots of the new
home-page demo section and of `/demo` itself, for `us` and `uz`, at desktop and phone width, under
`docs/demo-sayfasi/<code>/`.

They could not be produced in this session's sandbox:

- No Chromium (or other) browser binary is present in the container.
- Installing one (`playwright-chromium install chromium`) fails: the binary is served from
  `playwright-akamai.azureedge.net` / `playwright-verizon.azureedge.net`, and this session's egress proxy
  returns a policy denial (403) for those hosts. The proxy's own guidance is explicit: do not retry or route
  around an organization policy denial, report the blocked host instead.
- The session has a device connection (a MacBook Pro, per `get_device_info`), but its browser runs on that
  machine, not inside this container — it cannot reach a dev server running here without a tunnel, which is
  outside this task's scope and wasn't attempted without being asked.

What was verified instead, without a browser: the country kit test suite, `node scripts/ulke-duvarlari.mjs`,
`npx tsc --noEmit`, and `npm run build:ulke` for `us` and `uz` all pass on the final commit, including
`lib/ulke/demo/demo.paket.test.ts`, which renders the page (`react-dom/server`) and asserts the section's
markup, its three links to `/demo`, and its text, with the booking link set and unset.

Taking the screenshots needs either a network exception for the Chromium download, or the dev server exposed
to the connected device's browser — Kaan can ask for either as a follow-up.
