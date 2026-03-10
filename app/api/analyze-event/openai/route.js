import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
      model: "gpt-4.1",
      input: [
        {
          role: "user",
          content,
        },
      ],
    });

    const text = response.output_text || extractText(response.output);
    const clean = String(text || "").replace(/```json|```/g, "").trim();

    if (!clean) {
      return Response.json(
        { error: "Réponse vide du modèle OpenAI." },
        { status: 502 }
      );
    }

    try {
      const parsed = JSON.parse(clean);
      return Response.json(parsed);
    } catch {
      return Response.json(
        {
          error: "La réponse du modèle n'est pas un JSON valide.",
          raw: clean,
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