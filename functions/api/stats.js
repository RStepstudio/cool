/**
 * Cloudflare Pages Function: /api/stats
 * Counts visits per day, per week (ISO week starting Monday) and all time.
 * Requires a KV namespace bound as `VISITS` in the Pages project settings.
 * If the binding is missing the endpoint reports source: "none" and the
 * client falls back to a per-device counter stored in localStorage.
 */
export async function onRequest(context) {
  const { env } = context;
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Cache-Control": "no-store",
  };

  if (context.request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }

  if (!env || !env.VISITS) {
    return Response.json({ source: "none" }, { headers: cors });
  }

  const now = new Date();
  const day = now.toISOString().slice(0, 10);
  const monday = new Date(now);
  const offset = (monday.getUTCDay() + 6) % 7;
  monday.setUTCDate(monday.getUTCDate() - offset);
  const week = monday.toISOString().slice(0, 10);

  const id = context.request.headers.get("CF-Connecting-IP") || "anon";
  const seenKey = `seen:${id}:${day}`;
  const already = await env.VISITS.get(seenKey);

  if (!already) {
    await env.VISITS.put(seenKey, "1", { expirationTtl: 172800 });
    await env.VISITS.put("count:total", String((Number(await env.VISITS.get("count:total")) || 0) + 1));
    await env.VISITS.put(`count:day:${day}`, String((Number(await env.VISITS.get(`count:day:${day}`)) || 0) + 1));
    await env.VISITS.put(`count:week:${week}`, String((Number(await env.VISITS.get(`count:week:${week}`)) || 0) + 1));
  }

  const [total, d, w] = await Promise.all([
    env.VISITS.get("count:total"),
    env.VISITS.get(`count:day:${day}`),
    env.VISITS.get(`count:week:${week}`),
  ]);

  return Response.json(
    { source: "kv", today: Number(d) || 0, week: Number(w) || 0, total: Number(total) || 0 },
    { headers: cors }
  );
}
