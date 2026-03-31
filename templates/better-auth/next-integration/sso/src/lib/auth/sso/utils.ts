export function isReturnedUrlInContext(value: unknown): value is { url: string } {
  return typeof value === "object" && value !== null && "url" in value && typeof (value as Record<string, unknown>).url === "string";
}
