export async function gqlFetch<T>(query: string, variables?: Record<string, any>) {
  const url = import.meta.env.VITE_PUBLIC_PANOPTIC_SUBGRAPH;
  if (!url) throw new Error("Missing VITE_PUBLIC_PANOPTIC_SUBGRAPH");

  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`GraphQL HTTP ${res.status}`);
  const json = await res.json();

  console.log('json graphql', json);
  if (json.errors) throw new Error(json.errors.map((e: any) => e.message).join("; "));
  return json.data as T;
} 