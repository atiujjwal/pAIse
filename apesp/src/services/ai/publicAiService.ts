import { GoogleGenerativeAI } from "@google/generative-ai";
import { APP_FEATURES_CONTEXT } from "../../lib/appContext";
import { AiSecurityService } from "./aiSecurityService";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  generationConfig: { responseMimeType: "application/json" },
});

export class PublicAiService {
  static async generateResponse(query: string, history: any[] = []) {
    const sanitizedQuery = AiSecurityService.sanitizeInput(query);

    if (!sanitizedQuery || !sanitizedQuery.trim()) {
      return "Please ask a valid question.";
    }

    const chatHistory = history
      .map((msg) => ({
        role: msg.role === "USER" ? "user" : "model",
        parts: [{ text: msg.content }],
      }))
      .filter((m) => m.parts[0].text && m.parts[0].text.trim() !== "");

    const systemPrompt = `
      ROLE: Public Support Bot for "pAIse".
      KNOWLEDGE BASE: ${APP_FEATURES_CONTEXT}
      INSTRUCTIONS:
      1. Answer ONLY based on the Knowledge Base.
      2. If asked for personal data, say: "Please log in to see your data."
      3. Be brief (max 2 sentences).
    `;

    try {
      const chat = model.startChat({
        history: [
          { role: "user", parts: [{ text: systemPrompt }] },
          {
            role: "model",
            parts: [{ text: "Understood. I am ready to help." }],
          },
          ...chatHistory,
        ],
      });

      const result = await chat.sendMessage(sanitizedQuery);

      let responseText = result.response.text();

      try {
        const jsonResponse = JSON.parse(responseText);
        return jsonResponse?.answer ?? responseText;
      } catch {
        return "I'm having trouble connecting right now.";
      }
    } catch (error) {
      console.error("Public AI Error:", error);
      return "I'm having trouble connecting right now.";
    }
  }
}
