const { app, BrowserWindow, session } = require("electron");
const { spawn } = require("node:child_process");
const path = require("node:path");

const PORT = Number(process.env.TOKSCALE_DASH_PORT || "3333");
const AUTH = process.env.TOKSCALE_AUTH === "github";
const PUBLIC_URL = (process.env.TOKSCALE_PUBLIC_URL || "").replace(/\/$/, "");
const TARGET =
  AUTH || (PUBLIC_URL && !PUBLIC_URL.includes("127.0.0.1") && !PUBLIC_URL.includes("localhost"))
    ? PUBLIC_URL || `http://127.0.0.1:${PORT}`
    : `http://127.0.0.1:${PORT}`;

const REPO = process.env.CLANKER_REPO || `${process.env.HOME}/code/clanker-control-center`;

let child = null;

async function waitHealth(url, tries = 40) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(`${url}/api/health`);
      if (res.ok) return true;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  return false;
}

function maybeSpawn() {
  if (process.env.TOKSCALE_ELECTRON_SPAWN === "0") return;
  const vp = "/home/falco/.vite-plus/bin/vp";
  child = spawn(vp, ["node", "src/server/index.ts"], {
    cwd: REPO,
    stdio: "inherit",
    env: {
      ...process.env,
      TOKSCALE_DATA_DIR:
        process.env.TOKSCALE_DATA_DIR || `${process.env.HOME}/.local/share/tokscale-dashboard`,
    },
  });
}

async function createWindow() {
  const ses = session.fromPartition("clanker", { cache: false });
  const win = new BrowserWindow({
    width: 1280,
    height: 860,
    backgroundColor: "#050605",
    webPreferences: {
      session: ses,
      preload: path.join(__dirname, "preload.cjs"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });
  const ok = await waitHealth(TARGET, 8);
  if (!ok) {
    maybeSpawn();
    await waitHealth(TARGET);
  }
  await win.loadURL(TARGET);
}

void app.whenReady().then(() => void createWindow());
app.on("window-all-closed", () => {
  child?.kill();
  app.quit();
});
