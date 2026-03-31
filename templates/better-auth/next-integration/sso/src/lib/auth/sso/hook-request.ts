export type HookRequest = {
  query?: Record<string, unknown>;
  context: {
    returned?: unknown;
  }
}
