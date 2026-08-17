export type JobName = "graph" | "usage" | "sessions" | "tui";

export interface JobSnapshot {
  running: boolean;
  lastStartedAt: string | null;
  lastDurationMs: number | null;
  lastExitCode: number | null;
}

export interface AuthUser {
  login: string;
  avatarUrl: string;
}

export interface Status {
  refreshing: boolean;
  refreshingUsage: boolean;
  refreshingSessions: boolean;
  refreshingTui: boolean;
  hasData: boolean;
  hasUsage: boolean;
  hasTui: boolean;
  hasSessions: boolean;
  generatedAt: string | null;
  tuiTimestamp: number | null;
  usageFetchedAt: string | null;
  error: string | null;
  usageError: string | null;
  sessionsError: string | null;
  tuiError: string | null;
  authEnabled: boolean;
  authenticated: boolean;
  user: AuthUser | null;
  publicUrl: string | null;
  jobs?: Record<JobName, JobSnapshot>;
}

export interface RefreshResponse extends Status {
  started: boolean;
}

export interface HealthResponse {
  ok: true;
}

export interface MeResponse {
  authEnabled: boolean;
  authenticated: boolean;
  user: AuthUser | null;
}

export interface UsagePayload {
  fetchedAt: string;
  accounts: Account[];
}

export interface Account {
  provider: string;
  plan: string | null;
  email: string | null;
  metrics: Metric[];
  account?: { id: string; is_active?: boolean; label?: string };
  reset_credits?: { available_count: number };
  credit_status?: {
    balance: string;
    has_credits: boolean;
    unlimited: boolean;
    overage_limit_reached: boolean;
  };
  spend_control?: { reached: boolean };
}

export interface Metric {
  label: string;
  used_percent: number;
  remaining_percent: number;
  remaining_label: string | null;
  resets_at: string | null;
}

export interface TokenBreakdown {
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
  reasoning: number;
}

export interface GraphFile {
  meta: {
    generatedAt: string;
    version: string;
    dateRange: { start: string; end: string };
  };
  summary: {
    totalTokens: number;
    totalCost: number;
    totalDays: number;
    activeDays: number;
    averagePerDay: number;
    maxCostInSingleDay: number;
    clients: string[];
    models: string[];
  };
  years: Array<{
    year: string;
    totalTokens: number;
    totalCost: number;
    range: { start: string; end: string };
  }>;
  contributions: ContributionDay[];
  timeMetrics: {
    totalActiveTimeMs: number;
    longestContinuousMs: number;
    maxConcurrentSessions: number;
    sessionCount: number;
  };
}

export interface ContributionDay {
  date: string;
  totals: { tokens: number; cost: number; messages: number };
  intensity: 0 | 1 | 2 | 3 | 4;
  tokenBreakdown: TokenBreakdown;
  clients: Array<{
    client: string;
    modelId: string;
    providerId: string;
    tokens: TokenBreakdown;
    cost: number;
    messages: number;
  }>;
  activeTimeMs: number;
}

export interface Performance {
  msPer1KTokens: number | null;
  totalDurationMs: number;
  timedTokens: number;
  sampleCount: number;
  tokenCoverage: number;
}

export interface TuiCache {
  schemaVersion: number;
  timestamp: number;
  enabledClients: string[];
  includeSynthetic: boolean;
  groupBy: string;
  reportScope: { since: null; until: null; year: null };
  data: {
    models: TuiModel[];
    agents: TuiAgent[];
    daily: TuiDay[];
    hourly: TuiHour[];
    graph: { weeks: TuiGraphDay[][] };
    totalTokens: number;
    totalCost: number;
    currentStreak: number;
    longestStreak: number;
  };
}

export interface TuiModel {
  model: string;
  colorKey: string;
  provider: string;
  client: string;
  workspaceKey: string | null;
  workspaceLabel: string | null;
  tokens: TokenBreakdown;
  cost: number;
  performance: Performance;
  sessionCount: number;
}

export interface TuiAgent {
  agent: string;
  clients: string;
  tokens: TokenBreakdown;
  cost: number;
  messageCount: number;
}

export interface TuiDayModel {
  client: string;
  provider: string;
  displayName: string;
  colorKey: string;
  tokens: TokenBreakdown;
  cost: number;
  messages: number;
}

export interface TuiDay {
  date: string;
  tokens: TokenBreakdown;
  cost: number;
  models: unknown[];
  sourceBreakdown: Array<
    [
      string,
      {
        tokens: TokenBreakdown;
        cost: number;
        models: Array<[string, TuiDayModel]>;
      },
    ]
  >;
  messageCount: number;
  turnCount: number;
}

export interface TuiHour {
  datetime: string;
  tokens: TokenBreakdown;
  cost: number;
  clients: string[];
  models: Array<
    [
      string,
      {
        provider: string;
        displayName: string;
        colorKey: string;
        tokens: TokenBreakdown;
        cost: number;
      },
    ]
  >;
  messageCount: number;
  turnCount: number;
}

export interface TuiGraphDay {
  date: string;
  tokens: number;
  cost: number;
  intensity: number;
}

export interface SessionsReport {
  groupBy: "client,session,model";
  entries: SessionEntry[];
  totalInput: number;
  totalOutput: number;
  totalCacheRead: number;
  totalCacheWrite: number;
  totalMessages: number;
  totalCost: number;
  processingTimeMs: number;
}

export interface SessionEntry {
  client: string;
  mergedClients: string[] | null;
  sessionId: string;
  session?: string;
  model: string;
  provider: string;
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
  reasoning: number;
  messageCount: number;
  cost: number;
  performance: Performance;
  lastSeen?: number | string;
  last_seen?: number | string;
  lastActive?: number | string;
  last_active?: number | string;
}

export type ReadinessLevel = "critical" | "watch" | "ready" | "unknown";
