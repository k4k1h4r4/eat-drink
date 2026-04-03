export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const allowedOrigins = [
      "https://k4k1h4r4.github.io",
      // Optional for local testing:
      // "http://127.0.0.1:5500",
      // "http://localhost:5500",
    ];

    const requestOrigin = request.headers.get("Origin");
    const isAllowedOrigin = requestOrigin && allowedOrigins.includes(requestOrigin);

    const corsHeaders = {
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Vary": "Origin",
    };

    if (isAllowedOrigin) {
      corsHeaders["Access-Control-Allow-Origin"] = requestOrigin;
    }

    if (request.method === "OPTIONS") {
      if (!isAllowedOrigin) {
        return new Response("Forbidden", { status: 403 });
      }
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    if (request.method !== "GET") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: {
          "content-type": "application/json",
          ...(isAllowedOrigin ? corsHeaders : {}),
        },
      });
    }

    if (!isAllowedOrigin) {
      return new Response(JSON.stringify({ error: "Forbidden origin" }), {
        status: 403,
        headers: {
          "content-type": "application/json",
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
