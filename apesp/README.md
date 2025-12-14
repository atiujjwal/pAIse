<div align="center">
  <br />
  <a href="https://github.com/yourusername/paise">
    <img src="https://img.icons8.com/fluency/96/wallet.png" alt="pAIse Logo" width="80" height="80" />
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
    <a href="https://www.prisma.io/">
      <img src="https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma" alt="Prisma" />
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
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
- [Database Schema](#-database-schema)
- [Design System](#-design-system)
- [Contributing](#-contributing)

---

## 🚀 Introduction

**pAIse** is a modern, AI-powered expense management platform designed to simplify shared finances. Whether you are splitting rent with roommates, managing expenses during a group trip, or tracking personal debts with friends, pAIse ensures clarity, fairness, and zero friction.

Powered by **Google Gemini AI**, pAIse supports natural language and voice-based expense entry, automatically understanding context, categorizing expenses, and applying the correct split logic—so users can focus on experiences, not calculations.

---

## ✨ Key Features

### 💸 Smart Expense Splitting

Supports multiple real-world splitting strategies:

- **Equal Split** – Automatically divides the amount equally.
- **Exact Amounts** – Specify who owes exactly how much.
- **Percentage-Based** – Allocate expenses by percentage.
- **Shares-Based** – Distribute costs using weighted shares (e.g., 1x / 2x).

### 🤖 AI-Powered Expense Entry
- **AI Chatbot**:  
  Comfortably interact with AI to know app features and your expense details.
- **Voice Input**:  
  _“I paid 500 for lunch with Bob”_ → Expense created instantly.
- **Automatic Categorization**:  
  Expenses are intelligently tagged (Food, Travel, Utilities, etc.).
- **Context Awareness**:  
  Detects participants, payer, amount, and category automatically.

### 👥 Groups & Friends

- Create groups for trips, households, or events.
- Track direct 1:1 friend expenses.
- Role-based group access (Admin / Member).
- Clear balance visibility for every participant.

### 📊 Analytics Dashboard(compin soon)

- Category-wise expense breakdown (Pie Charts).
- Monthly spending trends (Bar Charts).
- Unified net balance across all groups and friends.

### 💳 Debt Settlement & Optimization

- Record settlements and repayments.
- Built-in **Debt Simplification Algorithm** to minimize the number of transactions within groups.

### 🎨 Modern UI & Experience

- Mobile-first, fully responsive design.
- Dark & Light mode with semantic theming.
- Soft glassmorphism effects and extra-rounded UI components for a friendly, premium feel.

---

## 🛠 Tech Stack

### Frontend

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS, Shadcn UI, Lucide Icons
- **State Management**:
  - Zustand (client state)
  - React Query (server state)
- **Forms & Validation**: React Hook Form + Zod
- **Charts**: Recharts

### Backend

- **Runtime**: Node.js (Next.js API Routes)
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: NextAuth.js
- **AI Integration**: Google Generative AI SDK (Gemini)

---

## 🏁 Getting Started

Follow the steps below to set up the project locally.

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- PostgreSQL database

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/paise.git
   cd paise
   ```

2. **Install dependencies**

    ```bash
    git clone https://github.com/yourusername/paise.git
    cd paise
    ```

2. **Install dependencies**

    ```bash
    npm install
    ```
3. **Set up the database**

    ```bash
    npx prisma generate
    npx prisma db push
    ```
4. **Run the development server**

    ```bash
    npm run dev
    ```
5. **Open http://localhost:3000 in your browser.**


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

        SMTP_USER="abcd@gmail.com"
        SMTP_PASS="abcd abcd abcd abcd"
    ```

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


## 🤝 Contributing

**Contributions are welcome and appreciated.**
    -Fork the repository
    -Create a feature branch

| Token        | Light Mode                                   | Dark Mode                                  | Usage                              |
|--------------|----------------------------------------------|--------------------------------------------|------------------------------------|
| Primary      | hsl(260, 92%, 64%) (Electric Purple)       | hsl(260, 92%, 68%)                       | Primary actions, branding          |
| Secondary    | hsl(160, 78%, 42%) (Mint Green)            | hsl(160, 78%, 48%)                       | Success states, “Owes You”         |
| Destructive  | hsl(0, 84%, 60%)                           | hsl(0, 84%, 60%)                         | Errors, “You Owe”                  |
| Background   | hsl(240, 20%, 99%)                         | hsl(240, 18%, 8%)                        | App background                     |
| Card         | hsl(0, 0%, 100%)                           | hsl(240, 15%, 12%)  


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