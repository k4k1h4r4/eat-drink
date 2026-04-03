export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const allowedOrigins = [
      "https://k4k1h4r4.github.io",
      // add custom domain here if you use one
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

    const upstream = getUpstream(url, env);

    if (!upstream) {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: {
          "content-type": "application/json",
          ...corsHeaders,
        },
      });
    }

    try {
      const upstreamRes = await fetch(upstream.toString(), {
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

function getUpstream(url, env) {
  // Spoonacular
  if (url.pathname.startsWith("/api/spoonacular")) {
    const upstreamPath = url.pathname.slice("/api/spoonacular".length);
    const upstreamUrl = new URL(`https://api.spoonacular.com${upstreamPath}`);

    for (const [key, value] of url.searchParams.entries()) {
      upstreamUrl.searchParams.set(key, value);
    }

    upstreamUrl.searchParams.set("apiKey", env.SPOONACULAR_API_KEY);
    return upstreamUrl;
  }

  // USDA Nutrition
  if (url.pathname.startsWith("/api/usda")) {
    const upstreamPath = url.pathname.slice("/api/usda".length);
    const upstreamUrl = new URL(`https://api.nal.usda.gov/fdc/v1${upstreamPath}`);

    for (const [key, value] of url.searchParams.entries()) {
      upstreamUrl.searchParams.set(key, value);
    }

    upstreamUrl.searchParams.set("api_key", env.USDA_API_KEY);
    return upstreamUrl;
  }

  return null;
}
