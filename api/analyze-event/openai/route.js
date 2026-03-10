import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const body = await req.json();
    const { prompt, images } = body;

    if (!prompt || !images) {
      return Response.json(
        { error: "Missing prompt or images" },
        { status: 400 }
      );
    }

    const content = [
      {
        type: "input_text",
        text: prompt,
      },
      ...images.map((img) => ({
        type: "input_image",
        image_url: `data:${img.mime};base64,${img.data}`,
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

    const text = response.output_text || "";

    const clean = text.replace(/```json|```/g, "").trim();

    let parsed;

    try {
      parsed = JSON.parse(clean);
    } catch {
      parsed = { raw: clean };
    }

    return Response.json(parsed);

  } catch (error) {
    console.error("OpenAI error:", error);

    return Response.json(
      {
        error: "OpenAI request failed",
        details: error.message,
      },
      { status: 500 }
    );
  }
}