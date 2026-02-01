export type Session = {
  key: string;
  model?: string;
  channel?: string;
  totalTokens?: number;
  updatedAt?: number | string;
  createdAt?: number | string;
  kind?: string;
} & Record<string, unknown>;

export type SessionsListResult = {
  count?: number;
  sessions: Session[];
} & Record<string, unknown>;

export type Channel = {
  id?: string;
  name?: string;
  platform?: string;
  status?: string;
  connected?: boolean;
  lastSeenAt?: number | string;
} & Record<string, unknown>;

export type ChannelsListResult = {
  count?: number;
  channels: Channel[];
} & Record<string, unknown>;

export type SessionStatusResult = {
  ok?: boolean;
  sessionKey?: string;
  changedModel?: unknown;
  statusText?: string;
} & Record<string, unknown>;
