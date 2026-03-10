import OpenAI from "openai";

export async function GET() {
  try {
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: "Dis simplement: API OpenAI fonctionne",
    });

    return Response.json({
      success: true,
      message: response.output_text
    });

  } catch (error) {
    return Response.json({
      success: false,
      error: error.message
    });
  }
}