export async function gqlRequest<T = any>(
  operationName: string,
  variables: Record<string, any> = {}
): Promise<T> {
  const res = await fetch('/gql2', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      operationName,
      variables,
      extensions: {
        persistedQuery: {
          version: 1,
          sha256Hash: '5b8dcf3e0a1ec3271e97f4a1908d04b4a7573712_' + operationName,
        },
      },
    }),
  });
  const json = await res.json();
  return json.data as T;
}
