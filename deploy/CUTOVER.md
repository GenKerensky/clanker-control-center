# Cutover notes

1. `cd ~/code/clanker-control-center && vp install && vp build`
2. Install `deploy/tokscale-dashboard.service` as `~/.config/systemd/user/tokscale-dashboard.service`
3. `systemctl --user daemon-reload && systemctl --user restart tokscale-dashboard`
4. Oneshots still curl `127.0.0.1:3333`. Behind a proxy, add a bearer to the oneshot services (not the timers).

JSON caches stay in `~/.local/share/tokscale-dashboard`.
