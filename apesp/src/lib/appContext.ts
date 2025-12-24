export const APP_FEATURES_CONTEXT = `
APP NAME: pAIse
TYPE: AI-powered expense sharing & management app

PURPOSE:
pAIse helps users track, split, and settle shared expenses with friends and groups using AI-assisted tools and clear balance tracking.

CORE CAPABILITIES:

1. EXPENSE CREATION
- Create expenses with:
  • A single friend (1:1 expense)
  • A group (multiple members)
- Expense creation methods:
  • Voice input (AI extracts details from speech)
  • Receipt scanning (AI extracts data from bill images)
  • Manual entry (description, amount, date, splits)

2. SPLITTING METHODS
- Supported split types:
  • Equal (default)
  • Exact amounts (user-defined)
  • Percentage (user-defined)
  • Shares (user-defined)

3. VOICE-BASED EXPENSE ENTRY
- Users can record expense details by voice.
- AI converts speech into a draft expense.
- Users can review, edit, re-record, or submit the expense.
- User need to describe total bill amount, description, who paid how much and who will owe what or how.

4. RECEIPT SCANNING
- Users can upload a photo of a bill.
- AI extracts amounts, description, date and total.
- A draft expense is created for user confirmation.

5. FRIENDS & CONNECTIONS
- Users can add friends via:
  • Email invite
  • Invite link
  • pAIse QR tag
- Only friends can share direct expenses with each other.

6. GROUPS
- Users can create groups (e.g., trips, households).
- Group expenses can only be shared among group members.
- The app maintains balances per group.

7. simplify debts button in groups
- Simplifies for all group members: Who owes whom

8. DASHBOARD & INSIGHTS
- Dashboard shows:
  • Net balance along with breakdown of Friends and groups balance
  • Total money spent along with breakdown of friends and groups
  • Spending trends
  • Category-wise breakdowns(Pie chart)
  • Recent expenses
  • Who are you owe & whom you owe
- Insights available weekly, monthly, and yearly.

9. AI ASSISTANT
- Users can ask natural language questions such as:
  • “How much do I owe Rahul?”
  • “What did I spend on food this month?”
  • “How do I add a friend?”
- AI answers based on app data (only when logged in) and app features.

10. PRIVACY & CONTROL
- Users control who interacts with them.
- Friend requests can be accepted or rejected.
- Users can block others if needed.

11. NOTIFICATIONS
- Notifications for:
  • Friend requests
  • Expense updates
  • Settlements
  • Group activity

USAGE LIMITS (CURRENT PHASE):
- Non-logged-in users: up to 5 AI chat interactions per day.
- Logged-in users: up to 10 AI chat interactions per day.
- Voice-based expense entry & receipt scanning: up to 5 uses per day.

GOAL:
Make shared expense management simple, accurate, and effortless using AI, while keeping users fully in control of their data.
`;
