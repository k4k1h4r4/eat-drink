export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== "GET") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: {
          "content-type": "application/json",
          ...corsHeaders,
        },
      });
    }

    const prefix = "/api/spoonacular";
    if (!url.pathname.startsWith(prefix)) {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: {
          "content-type": "application/json",
          ...corsHeaders,
        },
      });
    }

    const upstreamPath = url.pathname.slice(prefix.length);
    const upstreamUrl = new URL(`https://api.spoonacular.com${upstreamPath}`);

    for (const [key, value] of url.searchParams.entries()) {
      upstreamUrl.searchParams.set(key, value);
    }
    upstreamUrl.searchParams.set("apiKey", env.SPOONACULAR_API_KEY);

    try {
      const upstreamRes = await fetch(upstreamUrl.toString(), {
        method: "GET",
        headers: {
          "Accept": "application/json",
        },
      });

      const body = await upstreamRes.text();

      return new Response(body, {
        status: upstreamRes.status,
        headers: {
          "content-type": upstreamRes.headers.get("content-type") || "application/json",
          "cache-control": "public, max-age=300",
          ...corsHeaders,
        },
      });
    } catch (err) {
      return new Response(
        JSON.stringify({ error: "Upstream request failed", detail: String(err) }),
        {
          status: 502,
          headers: {
            "content-type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }
  },
};
