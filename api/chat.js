import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const allowedOrigins = [
  "https://pramodh-atkuri.github.io",
  "http://localhost:3000",
  "http://localhost:5173"
];

export default async function handler(req, res) {
  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({
      error: "OPENAI_API_KEY is not configured."
    });
  }

  try {
    const { message, level, history } = req.body || {};

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        error: "Please enter a question."
      });
    }

    if (message.length > 4000) {
      return res.status(400).json({
        error: "Question is too long."
      });
    }

    const recentHistory = Array.isArray(history)
      ? history.slice(-10)
      : [];

    const input = [
      {
        role: "system",
        content:
          "You are LearnSmart AI Tutor, an educational assistant for students. " +
          "Explain concepts clearly and step-by-step using simple language. " +
          "Give examples when useful. For exam questions, provide an exam-ready structure. " +
          "Encourage understanding rather than simply giving answers. " +
          `The student's level is ${level || "student"}.`
      },
      ...recentHistory.map(item => ({
        role: item.role === "assistant" ? "assistant" : "user",
        content: String(item.content || "")
      })),
      {
        role: "user",
        content: message
      }
    ];

    const response = await client.responses.create({
      model: "gpt-5.6-luna",
      input,
      max_output_tokens: 900
    });

    return res.status(200).json({
      answer:
        response.output_text ||
        "Sorry, I couldn't generate an answer."
    });

  } catch (error) {
    console.error("AI Tutor error:", error);

    return res.status(500).json({
      error: "The AI Tutor could not process your request right now."
    });
  }
}
