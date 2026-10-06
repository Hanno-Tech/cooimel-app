import { processarWebhook } from "@/lib/services/pagamentos";

export async function POST(request: Request, ctx: RouteContext<"/api/webhooks/pagamentos/[provider]">) {
  const { provider } = await ctx.params;
  const body = await request.text();
  try {
    const r = await processarWebhook(provider, body, request.headers);
    return Response.json({ ok: true, duplicado: r.duplicado });
  } catch (e) {
    console.error("[webhook]", provider, e);
    return Response.json({ ok: false }, { status: 400 });
  }
}
