import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed. Use POST.",
    });
  }

  try {
    const { message, messages } = req.body || {};

    // Check that we received a message
    if (
      (!message || typeof message !== "string") &&
      (!Array.isArray(messages) || messages.length === 0)
    ) {
      return res.status(400).json({
        error: "Please provide a message.",
      });
    }

    // Build conversation input
    let input = [];

    if (Array.isArray(messages) && messages.length > 0) {
      input = messages
        .filter(
          (item) =>
            item &&
            (item.role === "user" ||
              item.role === "assistant" ||
              item.role === "system")
        )
        .map((item) => ({
          role: item.role,
          content: String(item.content || ""),
        }))
        .filter((item) => item.content.trim() !== "");
    }

    // Add the latest user message if provided
    if (message && typeof message === "string" && message.trim() !== "") {
      input.push({
        role: "user",
        content: message.trim(),
      });
    }

    // Make sure there is something to send
    if (input.length === 0) {
      return res.status(400).json({
        error: "No valid message was provided.",
      });
    }

    // Ask the AI
    const response = await client.responses.create({
      model: "gpt-5.6-luna",
      instructions:
        "You are LearnSmart AI Tutor. Help students understand academic topics clearly and accurately. Explain concepts step by step, use simple language when appropriate, provide examples, and encourage learning. Do not simply give unexplained answers.",
      input,
      max_output_tokens: 900,
    });

    return res.status(200).json({
      answer:
        response.output_text ||
        "Sorry, I couldn't generate an answer.",
    });
  } catch (error) {
  console.error("AI Tutor error:", error);

  return res.status(500).json({
    error: error?.message || "Unknown AI error",
    details: error?.status || null
  });
}
}