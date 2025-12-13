import { prisma } from "@/src/lib/db";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Decimal } from "decimal.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  generationConfig: { responseMimeType: "application/json" },
});

export class PrivateAiService {
  static async handleUserQuery(userId: string, query: string) {
    await prisma.aiChatMessage.create({
      data: { user_id: userId, role: "USER", content: query },
    });

    // Fetch Context (Summary + Real Financial Data)
    const session = await prisma.aiChatSession.findUnique({
      where: { user_id: userId },
    });
    const historySummary = session?.summary || "No prior context.";

    // RAG: Fetch real data based on the user's ID
    const snapshot = await this.getFinancialSnapshot(userId);

    // Generate Answer
    const prompt = `
      ROLE: You are "pAIse", a personal financial accountant.
      
      CONTEXT SUMMARY: "${historySummary}"
      
      REAL-TIME FINANCIAL DATA:
      ${JSON.stringify(snapshot, null, 2)}
      
      USER QUERY: "${query}"
      
      INSTRUCTIONS:
      1. Answer strictly using the FINANCIAL DATA provided above.
      2. If the user asks "Who do I owe?", list people from 'you_owe'.
      3. If the user asks "Who owes me?", list people from 'owed_to_you'.
      4. If the user asks about recent spending, refer to 'recent_expenses'.
      5. Use "₹" for currency. Be concise and friendly.
      6. ALSO generate a 1-sentence summary of this specific interaction to update the long-term memory.
      
      OUTPUT JSON FORMAT ONLY:
      { "answer": "...", "new_summary": "..." }
    `;

    let answer = "I'm having trouble analyzing your finances right now.";
    let newSummary = historySummary;

    try {
      const result = await model.generateContent(prompt);
      const text = result.response
        .text()
        .replace(/```json|```/g, "")
        .trim();
      const parsed = JSON.parse(text);
      answer = parsed.answer;
      newSummary = parsed.new_summary;
    } catch (e) {
      console.error("AI Generation Error", e);
    }

    // Save Response & Update Memory
    await prisma.$transaction([
      prisma.aiChatMessage.create({
        data: { user_id: userId, role: "ASSISTANT", content: answer },
      }),
      prisma.aiChatSession.upsert({
        where: { user_id: userId },
        update: { summary: newSummary, last_active: new Date() },
        create: { user_id: userId, summary: newSummary },
      }),
    ]);

    return { answer };
  }

  // --- THE "ACCOUNTANT" LOGIC ---
  private static async getFinancialSnapshot(userId: string) {
    // Calculate Net Balances (Who owes who)
    const balances = await prisma.balance.findMany({
      where: { OR: [{ user_A_id: userId }, { user_B_id: userId }] },
      include: { user_a: true, user_b: true },
    });

    const you_owe: any[] = [];
    const owed_to_you: any[] = [];

    balances.forEach((b) => {
      let amount = new Decimal(0);
      let friendName = "";

      // Determine direction relative to current user
      if (b.user_A_id === userId) {
        amount = b.amount; // Positive = A gets back, Negative = A owes
        friendName = b.user_b.name;
      } else {
        amount = b.amount.negated(); // Reverse for B
        friendName = b.user_a.name;
      }

      if (amount.lessThan(0)) {
        you_owe.push({ name: friendName, amount: amount.abs().toFixed(2) });
      } else if (amount.greaterThan(0)) {
        owed_to_you.push({ name: friendName, amount: amount.toFixed(2) });
      }
    });

    // Get Recent Expenses (Last 5)
    const expenses = await prisma.expense.findMany({
      where: {
        status: "ACTIVE",
        OR: [
          { created_by_id: userId }, // I added it
          { payers: { some: { user_id: userId } } },
        ],
      },
      take: 5,
      orderBy: { date: "desc" },
      select: { description: true, amount: true, category: true, date: true },
    });

    return {
      overview: {
        total_people_you_owe: you_owe.length,
        total_people_owe_you: owed_to_you.length,
      },
      you_owe,
      owed_to_you,
      recent_expenses: expenses.map((e) => ({
        desc: e.description,
        amount: e.amount,
        date: e.date.toISOString().split("T")[0],
      })),
    };
  }
}
