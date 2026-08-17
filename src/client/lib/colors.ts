export const COLORS: Record<string, string> = {
  "gpt-5.6-sol": "#2dd4bf",
  "gpt-5.5": "#14b8a6",
  "gpt-5.6-terra": "#5eead4",
  "gpt-5.6-luna": "#99f6e4",
  "claude-opus-5": "#fb7185",
  "claude-opus-4-8": "#fb923c",
  "grok-4.5": "#facc15",
  "grok-4.6": "#eab308",
  "grok-4.3": "#ca8a04",
  "glm-5.2": "#a78bfa",
  "gpt-5.3-codex-spark": "#34d399",
  "kimi-k3": "#22d3ee",
  "minimax-m3": "#94a3b8",
};

export function colorFor(name: string): string {
  if (COLORS[name]) return COLORS[name];
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return `hsl(${h % 360} 70% 55%)`;
}

export const CLIENTS: Record<string, string> = {
  codex: "Codex CLI",
  claude: "Claude Code",
  opencode: "OpenCode",
  grok: "Grok Build",
  pi: "Pi",
};

export function clientName(id: string): string {
  return CLIENTS[id] || id || "";
}
