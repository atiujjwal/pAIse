/**
 * Token-Optimized Object Notation (TOON) Formatter
 * * A custom formatter designed to compress financial snapshot data into
 * a highly token-efficient string format for LLM consumption.
 * * STRATEGY:
 * - Removes redundant keys (e.g., "name": "Alice" -> "Alice")
 * - Uses positional context (e.g., "Alice:500" implies Name:Amount)
 * - Uses compact delimiters ("," for items, "|" or newlines for sections)
 */

export const toTOON = (snapshot: any): string => {
  const lines = [];

  // Overview Stats
  lines.push(
    `STATS:Debtors=${snapshot.overview.total_people_you_owe},Creditors=${snapshot.overview.total_people_owe_you}`
  );

  // Debts (People I owe)
  if (snapshot.you_owe.length > 0) {
    const debts = snapshot.you_owe
      .map((p: any) => `${p.name}:${p.amount}`)
      .join(",");
    lines.push(`I_OWE:${debts}`);
  } else {
    lines.push(`I_OWE:None`);
  }

  // Credits 
  if (snapshot.owed_to_you.length > 0) {
    const credits = snapshot.owed_to_you
      .map((p: any) => `${p.name}:${p.amount}`)
      .join(",");
    lines.push(`OWED_TO_ME:${credits}`);
  } else {
    lines.push(`OWED_TO_ME:None`);
  }

  // Recent Activity
  if (snapshot.recent_expenses.length > 0) {
    const recent = snapshot.recent_expenses
      .map((e: any) => `${e.desc}(${e.amount})@${e.date}`)
      .join("; ");
    lines.push(`RECENT:${recent}`);
  } else {
    lines.push(`RECENT:None`);
  }

  return lines.join("\n");
};

/**
 * Static Application Context in TOON format.
 */
export const APP_FEATURES_TOON = `
APP:pAIse|TYPE:AI Expense Manager|GOAL:Track,Split,Settle
CREATE:Voice(AI extracts Desc,Amt,Payer,Split),Scan(OCR-Bill),Manual
SPLIT_MODES:Equal,Exact,%,Shares
ENTITIES:Friends(Invite/Link/QR,1:1),Groups(Trips/Home,GroupBal)
FEATURES:SimplifyDebts(Group),Dashboard(NetBal,Trends,CatPie,Recent),Notifications
AI_BOT:Answers FinData & AppHelp queries
PRIVACY:BlockUser,Accept/RejectFriend
LIMITS(Daily):Guest=5chat;User=10chat,5voice/scan
`.trim();
