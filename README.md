# 💸 Budget Tracker

A modern web application built with **React**, **TypeScript**, **Vite**, **Tailwind CSS**, and **Supabase** to help users track and manage their personal expenses with ease.

## ✨ Features

- 🔐 User authentication (Sign Up / Sign In) powered by Supabase Auth
- 🗂️ Create, view, and delete spending **categories**
- 💸 Add, view, and delete **expenses**, with category association
- 👤 Expenses are scoped per authenticated user
- 🎨 Clean, responsive UI styled with Tailwind CSS

## 📁 Project Structure

```
/
├── public/
├── src/
│   ├── components/         # UI Components (Auth, Categories, ExpenseForm, ExpenseList)
│   ├── lib/                # Supabase client, types, and utilities
│   │   ├── supabaseClient.ts
│   │   └── database.types.ts
│   ├── App.tsx             # Main app component
│   ├── index.css           # Tailwind base styles
│   ├── main.tsx            # Entry point
│   └── vite-env.d.ts       # Vite env types
├── supabase/
│   └── migrations/         # SQL migration scripts
├── .env                    # Supabase environment variables (not committed)
├── .eslintrc.cjs           # ESLint configuration
├── index.html              # HTML entry point
├── package.json            # Project scripts and dependencies
├── postcss.config.js       # PostCSS config
├── tailwind.config.js      # Tailwind CSS config
├── tsconfig.json           # TypeScript config
├── tsconfig.node.json      # Node-specific TS config
└── vite.config.ts          # Vite configuration
```

## 🧱 Layout Components: Sidebar, Navbar, and Footer

Enhance navigation and usability with a consistent layout structure:

### 🧭 Navbar

- Logo / App title (clickable)
- User info (e.g., name or email)
- Logout button
- Optional navigation links (Dashboard, Profile, Reports, etc.)

**Component:** `components/layout/Navbar.tsx`

> Use Tailwind for sticky positioning and responsive flex layout.

---

### 📂 Sidebar

- Navigation to major sections: Dashboard, Categories, Expenses, Reports, Settings, Household
- Active route highlighting
- Collapsible for mobile
- Use icon libraries like [Lucide](https://lucide.dev/) or Heroicons

**Component:** `components/layout/Sidebar.tsx`

> Use `react-router` or `@tanstack/router` for navigation.

---

### 📎 Footer

- App version or build info
- Copyright
- Optional links to privacy policy or help

**Component:** `components/layout/Footer.tsx`

> Implement sticky footer using flex layout and `flex-grow`.

---

### 📐 Layout Wrapper Example

```tsx
// components/layout/AppLayout.tsx

return (
  <div className="flex flex-col min-h-screen">
    <Navbar />
    <div className="flex flex-1">
      <Sidebar />
      <main className="flex-1 p-4">{children}</main>
    </div>
    <Footer />
  </div>
);
```

## 🛠️ Setup and Running Locally

1. **Clone the repository:**

   ```bash
   git clone <repository-url>
   cd <project-directory>
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Create your Supabase project:**

   - Go to [supabase.com](https://supabase.com/) and create a new project
   - Run SQL scripts from `/supabase/migrations` to set up tables and policies

4. **Set environment variables:**
   Create a `.env` file with:

   ```env
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

5. **(Optional) Generate Supabase Types:**

   ```bash
   npm run types:generate
   ```

6. **Run the app locally:**
   ```bash
   npm run dev
   ```

---

## 🌱 Potential Feature Improvements

- ✏️ Edit existing expenses and categories
- 📊 Data visualization with charts (pie/bar) via `recharts`
- 🎯 Budget goals by category or timeframe
- 📈 Monthly/yearly spending reports
- 🔍 Filter and sort expenses by date, amount, or category
- 🔎 Search functionality for expenses or categories
- 👤 User profile management (change password, etc.)
- 📁 Export data to CSV
- 🖼️ UI/UX improvements (validation, animations, feedback)
- 📱 Full mobile responsiveness
- 🔁 Recurring expenses
- 🏷️ Expense tagging and label system
- 🏡 Household budgeting: Invite family members to a shared budget
- 🧭 App layout improvements with sidebar, navbar, and footer
