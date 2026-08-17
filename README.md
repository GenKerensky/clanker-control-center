# Clanker Control Center

Local dashboard for LLM quotas, usage history, and sessions. Solid SPA + Hono, driven by `@tokscale/cli`.

## Run

```bash
vp install
vp dev          # 127.0.0.1:5173
vp build
vp node src/server/index.ts   # 127.0.0.1:3333
```

JSON caches stay in `~/.local/share/tokscale-dashboard`. The user unit is `tokscale-dashboard.service`.

AppImage: `vp run appimage`, then Gear Lever → integrate.

License: MIT.
