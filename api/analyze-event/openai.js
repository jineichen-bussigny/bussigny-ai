import OpenAI from "openai";

export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {

    const { prompt, images } = req.body;

    const content = [
      { type: "input_text", text: prompt },
      ...images.map(img => ({
        type: "input_image",
        image_url: `data:${img.mime};base64,${img.data}`
      }))
    ];

    const response = await openai.responses.create({
      model: "gpt-4.1",
      input: [
        {
          role: "user",
          content
        }
      ]
    });

    const text = response.output_text;

    const clean = text.replace(/```json|```/g, "").trim();

    const parsed = JSON.parse(clean);

    res.status(200).json(parsed);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: "OpenAI error",
      details: error.message
    });

  }
}