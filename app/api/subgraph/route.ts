import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_PANOPTIC_SUBGRAPH!;
  const body = await req.text();
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body,
  });
  return new Response(await res.text(), { status: res.status, headers: { "content-type": "application/json" } });
} 