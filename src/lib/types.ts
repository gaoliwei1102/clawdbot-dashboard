export type Session = {
  key: string;
  model?: string;
  channel?: string;
  totalTokens?: number;
  updatedAt?: string;
  createdAt?: string;
  kind?: string;
} & Record<string, unknown>;

export type SessionsListResult = {
  sessions: Session[];
} & Record<string, unknown>;

export type Channel = {
  id?: string;
  name?: string;
  platform?: string;
  status?: string;
  connected?: boolean;
  lastSeenAt?: string;
} & Record<string, unknown>;

export type ChannelsListResult = {
  channels: Channel[];
} & Record<string, unknown>;

export type SessionStatusResult = {
  details?: { statusText?: string } & Record<string, unknown>;
} & Record<string, unknown>;

