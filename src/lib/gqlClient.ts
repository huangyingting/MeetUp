export async function gqlRequest<T = any>(
  operationName: string,
  variables: Record<string, unknown> = {}
): Promise<T> {
  const res = await fetch('/gql2', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({ operationName, variables }),
  });
  const json = await res.json();
  if (!res.ok || json.errors?.length) {
    if (res.status === 401 && typeof window !== 'undefined') {
      const callbackUrl = window.location.pathname + window.location.search;
      window.location.assign(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
    }
    throw new Error(json.errors?.[0]?.message || json.error || `Request failed (${res.status})`);
  }
  return json.data as T;
}
