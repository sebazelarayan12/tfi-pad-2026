export type Query = Readonly<Record<string, string | number | boolean | null | undefined>>;

export function serializarQuery(query: Query = {}): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== null && value !== undefined) params.append(key, String(value));
  }
  return params.toString();
}
