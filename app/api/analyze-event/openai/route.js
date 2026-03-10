import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Rate limiting: 15 requests per IP per hour
const rateLimitMap = new Map();
const RATE_LIMIT = 15;
const WINDOW_MS = 60 * 60 * 1000; // 1 hour

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT) {
    return false;
  }

  entry.count++;
  return true;
}

function extractText(output) {
  if (!output) return "";

  if (typeof output === "string") return output;

  if (Array.isArray(output)) {
    for (const item of output) {
      if (item.type === "message" && Array.isArray(item.content)) {
        const textItem = item.content.find((c) => c.type === "output_text");
        if (textItem?.text) return textItem.text;
      }
      if (item.type === "output_text" && item.text) {
        return item.text;
      }
    }
  }

  return "";
}

export async function GET() {
  return Response.json({
    ok: true,
    message: "API route exists",
  });
}

export async function POST(req) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  if (!checkRateLimit(ip)) {
    return Response.json(
      { error: "Trop de requêtes. Limite : 15 par heure." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const { prompt, images = [] } = body || {};

    if (!prompt) {
      return Response.json({ error: "Missing prompt" }, { status: 400 });
    }

    const content = [
      {
        type: "input_text",
        text: prompt,
      },
      ...images.map((img) => ({
        type: "input_image",
        image_url: `data:${img.mime || "image/jpeg"};base64,${img.data}`,
      })),
    ];

    const response = await client.responses.create({
      model: "gpt-4o",
      input: [
        {
          role: "user",
          content,
        },
      ],
      text: { format: { type: "json_object" } },
    });

    const text = response.output_text || extractText(response.output);

    if (!text) {
      return Response.json(
        { error: "Réponse vide du modèle OpenAI." },
        { status: 502 }
      );
    }

    try {
      const parsed = JSON.parse(text);
      return Response.json(parsed);
    } catch {
      return Response.json(
        {
          error: "La réponse du modèle n'est pas un JSON valide.",
          raw: text,
        },
        { status: 502 }
      );
    }
  } catch (error) {
    return Response.json(
      {
        error: "OpenAI request failed",
        details: error?.message || "unknown_error",
      },
      { status: 500 }
    );
  }
}