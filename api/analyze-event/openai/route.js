import OpenAI from "openai";

const openai = new OpenAI({
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

export async function POST(request) {
  try {
    const { prompt, images } = await request.json();

    if (!prompt || !Array.isArray(images) || images.length === 0) {
      return Response.json(
        { error: "Payload invalide. Attendu: { prompt, images[] }" },
        { status: 400 }
      );
    }

    const inputContent = [
      { type: "input_text", text: prompt },
      ...images.map((img) => ({
        type: "input_image",
        image_url: `data:${img.mime || "image/jpeg"};base64,${img.data}`,
      })),
    ];

    const response = await openai.responses.create({
      model: "gpt-4.1",
      input: [
        {
          role: "user",
          content: inputContent,
        },
      ],
      temperature: 0.4,
    });

    const text = response.output_text || extractText(response.output);
    const clean = String(text || "").replace(/```json|```/g, "").trim();

    if (!clean) {
      return Response.json(
        { error: "Réponse vide du modèle OpenAI." },
        { status: 502 }
      );
    }

    const parsed = JSON.parse(clean);
    return Response.json(parsed);
  } catch (error) {
    return Response.json(
      {
        error: "Erreur serveur lors de l'analyse OpenAI.",
        details: error?.message || "unknown_error",
      },
      { status: 500 }
    );
  }
}