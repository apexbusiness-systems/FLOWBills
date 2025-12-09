export const toMessage = (err: unknown) =>
  err instanceof Error ? err.message : typeof err === 'string' ? err : JSON.stringify(err);
