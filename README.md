# 💸 Budget Tracker

A modern web application built with **React**, **TypeScript**, **Vite**, **Tailwind CSS**, and **Supabase** to help users track and manage their personal and household expenses with ease.

## ✨ Features

- 🔐 User authentication (Sign Up / Sign In) powered by Supabase Auth
- 👤 User profile management (Password Change, **Account Deletion**)
- 🗂️ Create, view, edit, and delete spending **categories**
- 💸 Add, view, edit, and delete **expenses**, with category and tag association
- 💰 Add, view, and delete **income** records
- 🎯 Create, view, edit, and delete **budgets** (overall or per category) with progress tracking
- 🏷️ Tag expenses with custom tags (create, view, link/unlink)
- 📊 Data visualization:
    - Pie chart for expenses by category
    - Line chart for income vs. expense trend over time
    - Monthly summary report (income, expenses, net, category breakdown)
- 🏡 **Household Management**:
    - Create households
    - Invite members via email lookup
    - View household members and their roles
    - Roles: Owner, Admin, Member
    - Owners/Admins can remove members
    - Owners/Admins can promote members to Admin or demote Admins to Member
    - Leave households (non-owners)
    - Delete households (owners only)
- ⚙️ **Settings Page**: Centralized location for User Profile and Household Management.
- 🧭 **Application Layout**: Consistent navigation using Navbar, Sidebar, and Footer.
- 🎨 Clean, responsive UI styled with Tailwind CSS
- 📥 Export all personal expenses to CSV

## 📁 Project Structure

```
/
├── public/
├── src/
│   ├── components/         # UI Components (Auth, Forms, Lists, Charts, Layout, etc.)
│   │   └── layout/         # Navbar, Sidebar, Footer, AppLayout
│   ├── hooks/              # Custom React Hooks (data fetching, mutations - currently basic)
│   ├── lib/                # Supabase client, types, utilities
│   │   ├── supabaseClient.ts
│   │   └── database.types.ts
│   ├── pages/              # Page components (e.g., SettingsPage)
│   ├── App.tsx             # Main app component, routing logic
│   ├── index.css           # Tailwind base styles
│   ├── main.tsx            # Entry point
│   └── vite-env.d.ts       # Vite env types
├── supabase/
│   ├── migrations/         # SQL migration scripts (schema, RLS policies)
│   └── functions/          # Edge Functions (e.g., delete-user)
│       ├── _shared/        # Shared code for functions (e.g., cors)
│       └── delete-user/
├── .env                    # Supabase environment variables (MUST BE CREATED)
├── eslint.config.js        # ESLint configuration
├── index.html              # HTML entry point
├── package.json            # Project scripts and dependencies
├── postcss.config.js       # PostCSS config
├── tailwind.config.js      # Tailwind CSS config
├── tsconfig.json           # TypeScript config (root)
├── tsconfig.app.json       # TypeScript config (app-specific)
├── tsconfig.node.json      # TypeScript config (Node env specific)
└── vite.config.ts          # Vite configuration
```

## 🧱 Layout Components: Sidebar, Navbar, and Footer

Enhance navigation and usability with a consistent layout structure:

### 🧭 Navbar

- Logo / App title (clickable, navigates to Dashboard)
- User info (email)
- Logout button
- Mobile sidebar toggle

**Component:** `src/components/layout/Navbar.tsx`

### 📂 Sidebar

- Navigation to major sections: Dashboard, Settings
- Active route highlighting (basic implementation)
- Collapsible for mobile view

**Component:** `src/components/layout/Sidebar.tsx`

### 📎 Footer

- Copyright information

**Component:** `src/components/layout/Footer.tsx`

### 📐 Layout Wrapper

The `src/components/layout/AppLayout.tsx` component wraps the main application content, providing the consistent Navbar, Sidebar, and Footer structure.

## 🏡 Household Management Details

- **Roles**:
    - `owner`: Created the household, has full control, cannot be removed or demoted. Can delete the household.
    - `admin`: Can manage members (add, remove, promote/demote other non-owner members). Can be demoted by the owner.
    - `member`: Can view household information (details pending full implementation). Cannot manage other members.
- **Data Scope**: Currently, expenses, incomes, budgets, etc., are primarily personal. Household-scoped data sharing is a potential future feature.
- **Implementation**: Managed within the `SettingsPage` via the `HouseholdManager` component. Uses RLS policies extensively for access control.

## 🗑️ Account Deletion

- Accessible via the User Profile section on the Settings page.
- Requires email confirmation for safety.
- Uses a Supabase Edge Function (`delete-user`) with admin privileges to perform the deletion.
- Relies on `ON DELETE CASCADE` database constraints to remove associated user data (expenses, categories, budgets, incomes, tags, household memberships, owned households).

## 🛠️ Setup and Running Locally

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd <project-directory>
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```
    *(Or `pnpm install` if using pnpm)*

3.  **Create your Supabase project:**
    - Go to [supabase.com](https://supabase.com/) and create a new project.
    - In the Supabase dashboard SQL Editor, run the SQL scripts from `/supabase/migrations` one by one to set up tables, RLS policies, and functions. Pay attention to the order if necessary, although filenames don't enforce it.
    - **Disable Email Confirmation**: Go to `Authentication -> Providers -> Email` and toggle off "Confirm email".
    - **Set up Edge Function**:
        - Deploy the `delete-user` function using the Supabase CLI (outside the scope of this README) or manually create it in the dashboard.
        - Go to `Edge Functions`, select the `delete-user` function.
        - Go to `Settings` for the function and add a secret named `SUPABASE_SERVICE_ROLE_KEY`. Paste your project's Service Role Key (found in `Project Settings -> API -> Project API keys`) as the value.

4.  **Set environment variables:**
    Create a `.env` file in the project root with your Supabase credentials:
    ```env
    VITE_SUPABASE_URL=your-supabase-project-url
    VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
    ```
    *(Replace with your actual URL and Anon key from `Project Settings -> API`)*

5.  **(Optional) Generate Supabase Types:**
    If you make schema changes, regenerate TypeScript types:
    ```bash
    # Make sure SUPABASE_PROJECT_ID is set as an environment variable or replace $SUPABASE_PROJECT_ID with your actual project ID
    npm run types:generate
    ```

6.  **Run the app locally:**
    ```bash
    npm run dev
    ```

---

## 🌱 Potential Feature Improvements

- **Household Data Sharing**: Allow expenses/budgets/incomes to be explicitly linked to a household and viewable/editable by members based on permissions.
- **Invitations**: Implement a proper invitation system (e.g., email links with tokens) instead of direct email lookup for adding members.
- **Transfer Ownership**: Allow household owners to transfer ownership to another member.
- **Advanced Reporting**: More filtering/grouping options, custom date ranges, chart customization.
- **Recurring Transactions**: Set up recurring expenses and incomes.
- **UI/UX Enhancements**: Improved form validation, loading states, animations, accessibility.
- **Mobile Responsiveness**: Further refinement for various screen sizes.
- **Testing**: Implement unit and integration tests.
- **Currency/Date Formatting**: User preferences for display formats.
- **Notifications**: In-app or email notifications (e.g., budget alerts, new members).
- **Two-Factor Authentication (2FA)**: Enhance security via Supabase Auth settings.
