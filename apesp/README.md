<div align="center">
  <br />
  <a href="https://github.com/yourusername/paise">
    <img src="https://res.cloudinary.com/do1f9qqik/image/upload/v1766671265/new_paise_logo_04_y8ifrh.png" alt="pAIse Logo" width="80" height="80" />
  </a>

  <h1 align="center">pAIse</h1>

  <p align="center">
    <strong>Split bills, not friendships.</strong><br />
    The AI-powered expense manager for modern groups, roommates, and travelers.
  </p>

  <p align="center">
    <a href="https://nextjs.org">
      <img src="https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js" alt="Next.js" />
    </a>
    <a href="https://www.typescriptlang.org/">
      <img src="https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript" alt="TypeScript" />
    </a>
    <a href="https://tailwindcss.com/">
      <img src="https://img.shields.io/badge/Tailwind_CSS-3.0-38B2AC?style=flat-square&logo=tailwind-css" alt="Tailwind CSS" />
    </a>
    <a href="https://supabase.com/">
      <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase" alt="Supabase" />
    </a>
    <a href="https://upstash.com/">
      <img src="https://img.shields.io/badge/Upstash-Redis-00E9A3?style=flat-square&logo=redis" alt="Upstash" />
    </a>
    <a href="https://ai.google.dev/">
      <img src="https://img.shields.io/badge/AI-Gemini-8E75B2?style=flat-square&logo=google-gemini" alt="Gemini AI" />
    </a>
  </p>
</div>

---

## 📋 Table of Contents

- [Introduction](#-introduction)
- [Key Features](#-key-features)
- [Infrastructure & Deployment](#-infrastructure--deployment)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Database Schema](#-database-schema)
- [Design System](#-design-system)
- [Contributing](#-contributing)

---

## 🚀 Introduction

**pAIse** is a next-generation financial utility application designed to solve the perennial chaos of shared expenses. Unlike traditional ledgers, pAIse leverages **Generative AI** to act as an intelligent financial assistant.

Whether you are splitting rent with roommates, managing a group trip to Goa, or just tracking lunch debts, pAIse automates the boring stuff—data entry, categorization, and math—so you can focus on the experience.

---

## ✨ Key Features

### 🤖 AI-Powered Intelligence

The core of pAIse is its deep integration with Google Gemini AI models:

- **Voice-Powered Entry**: Simply say, _"I paid 500 for lunch with Bob, split equally."_ The app transcribes the audio, extracts structured data (Amount: 500, Payer: Me, Payee: Bob), and creates the transaction automatically.
- **Smart Receipt Scanning**: Snap a photo of a physical bill. Our OCR + AI pipeline extracts line items, totals, and taxes to populate the expense form instantly.
- **Context-Aware Chatbot**: A dual-mode assistant.
  - _Public Mode:_ Answers questions about app features.
  - _Private Mode:_ Securely queries your personal data (e.g., _"How much do I owe Rahul for the trip?"_).

### 💸 Flexible Expense Splitting

We handle complex real-world scenarios effortlessly:

- **Equal Split**: Automatically divides the total among selected members.
- **Exact Amounts**: Specify exactly who owes what (e.g., You owe ₹200, Bob owes ₹300).
- **Percentage-Based**: Allocate costs by percentage (e.g., 60% / 40%).
- **Shares-Based**: Distribute costs by weight (e.g., 2 shares for a couple, 1 share for a single person).

### 📊 Dynamic Dashboard & Insights

- **Net Balance View**: Instantly see your total "You Owe" vs. "You are Owed" status.
- **Spending Trends**: Visual charts (Weekly/Monthly) to track your expense habits.
- **Category Breakdown**: See exactly where your money goes (Food, Travel, Rent, etc.).
- **Activity Feed**: A real-time timeline of all group activities and expenses.

### 👥 Groups, Friends & Settlement

- **Seamless Connections**: Add friends via Email, invite links, or by scanning unique **pAIse QR Tags**.
- **Group Management**: Create trips or households with role-based access (Admins/Members).
- **One-Click Settlement**: Record cash or UPI payments to settle debts instantly.
- **Smart Notifications**: Get alerted via App and Email when you are added to expenses, groups, or reminded to pay.

---

## ☁️ Infrastructure & Deployment

pAIse is architected for performance, security, and scalability using a modern serverless stack.

| Component          | Technology        | Description                                                                                                                                                                                          |
| :----------------- | :---------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Hosting & Edge** | **Vercel**        | The frontend and API routes are deployed on Vercel, leveraging their global Edge Network for low latency and automatic scaling of serverless functions.                                              |
| **Database**       | **Supabase**      | We use Supabase as a managed **PostgreSQL** provider. It handles robust relational data persistence, complex join queries for settlements, and ensures data integrity with foreign key constraints.  |
| **Rate Limiting**  | **Upstash Redis** | To protect our expensive AI API routes and prevent DDoS attacks, we use Upstash Redis at the edge. It enforces strict rate limits (e.g., 5 AI requests/day for free users) with millisecond latency. |
| **AI Processing**  | **Google Gemini** | All generative tasks (Voice parsing, Chatbot, OCR context) are processed via the Gemini API.                                                                                                         |

---

## 🛠 Tech Stack

### Frontend

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS, Shadcn/UI (for accessible components)
- **State Management**: Zustand (Client), TanStack Query (Server state)
- **Forms**: React Hook Form + Zod Validation

### Backend

- **Runtime**: Node.js Serverless Functions
- **ORM**: Prisma (Auto-generated type-safe database client)
- **Authentication**: Custom JWT implementation with HTTP-Only cookies for maximum security.
- **Security**:
  - **Helmet**: Secure HTTP Headers (HSTS, X-Frame-Options).
  - **Middleware**: Edge-based JWT verification.

---

## 🏁 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- A Supabase project (for PostgreSQL)
- Google Cloud Console project (for Gemini API)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/paise.git
   cd paise
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up Environment Variables** - Create a .env file in the root directory and populate it with your keys

### Environment Variables

```bash
    # Auth
    JWT_SECRET="abcd"
    JWT_EXPIRES_IN="7d"
    JWT_DATA_SECRET="abcd"

    JWT_REFRESH_SECRET="abcd"
    JWT_REFRESH_EXPIRES_IN="4h"

    # Google OAuth
    GOOGLE_CLIENT_ID="abcd-abcd.apps.googleusercontent.com"
    GOOGLE_CLIENT_SECRET="GOCSPX-abcd-"

    # External APIs
    OPENAI_API_KEY="sk-abcd"
    GOOGLE_CLOUD_VISION_API_KEY="..."
    GEMINI_API_KEY="abcd"

    #Brevo Template credentials
    BREVO_API_KEY="abcd-abcd-abcd"

    #Twillo SMS credentials
    TWILIO_ACCOUNT_SID=abcd
    TWILIO_AUTH_TOKEN=abcd
    TWILIO_FROM_PHONE_NUMBER='+19123456761'


    # Next.js
    NEXT_PUBLIC_API_URL="http://localhost:3000/api"
    NEXT_PUBLIC_APP_URL="http://localhost:3000"
    NODE_ENV="development"

    # SMTP
    SMTP_USER="abcd@gmail.com"
    SMTP_PASS="abcd abcd abcd abcd"


    # --- Database (Supabase) ---
    DATABASE_URL="postgresql://postgres:[PASSWORD]@db.supabase.co:5432/postgres"
    DIRECT_URL="postgresql://postgres:[PASSWORD]@db.supabase.co:5432/postgres"

    # --- Authentication ---
    JWT_SECRET="your-super-secret-key"
    JWT_EXPIRES_IN="7d"
    JWT_REFRESH_SECRET="your-refresh-secret"

    # --- AI Services ---
    GEMINI_API_KEY="your-google-gemini-key"

    # --- Rate Limiting (Upstash) ---
    UPSTASH_REDIS_REST_URL="your-upstash-url"
    UPSTASH_REDIS_REST_TOKEN="your-upstash-token"
```

4. **Initialize Database**

   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the development server**

   ```bash
   npm run dev
   ```

6. **Open http://localhost:3000 in your browser.**

## 🗄 Database Schema

### The core data model is centered around expense clarity and traceability:

- **User**:
  - Stores profile details, authentication credentials, and preferences.
- **Friendship**:
  - Self-referential relationship managing direct friend connections.
- **Group**:
  - Represents trips or shared spaces, containing members and expenses.
- **GroupMember**:
  - Defines user roles and access within a group.
- **Expense**:
  - Central entity storing payer, amount, category, and split logic.
- **Settlement**:
  - Records repayments and balance clearances between users.

## 🎨 Design System

**We utilize a semantic color system for Light and Dark modes to ensure consistency.**

| Token       | Light Mode                           | Dark Mode          | Usage                      |
| ----------- | ------------------------------------ | ------------------ | -------------------------- |
| Primary     | hsl(260, 92%, 64%) (Electric Purple) | hsl(260, 92%, 68%) | Primary actions, branding  |
| Secondary   | hsl(160, 78%, 42%) (Mint Green)      | hsl(160, 78%, 48%) | Success states, “Owes You” |
| Destructive | hsl(0, 84%, 60%)                     | hsl(0, 84%, 60%)   | Errors, “You Owe”          |
| Background  | hsl(240, 20%, 99%)                   | hsl(240, 18%, 8%)  | App background             |
| Card        | hsl(0, 0%, 100%)                     | hsl(240, 15%, 12%) |

## 🤝 Contributing

Contributions are welcome and appreciated! 🚀  
To contribute, please follow these steps:

1. **Fork the repository**

2. **Create a feature branch**
   ```bash
   git checkout -b feature/AmazingFeature
   ```
3. **Commit your changes**
   ```bash
   git commit -m "Add AmazingFeature"
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/AmazingFeature
   ```
5. **Open a Pull Request**

<div align="center"> <p>Made with ❤️ by Ujjwal Kashyap</p> </div>
