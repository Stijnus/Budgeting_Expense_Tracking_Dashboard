# Budget Tracker

A simple web application built with React, TypeScript, Vite, Tailwind CSS, and Supabase to track personal expenses.

## Features

*   User authentication (Sign Up / Sign In) via Supabase Auth.
*   Create, view, and delete spending categories.
*   Add, view, and delete expenses, associating them with categories.
*   Expenses are linked to the logged-in user.
*   Basic UI styled with Tailwind CSS.

## Project Structure

```
/
├── public/
├── src/
│   ├── components/       # React components (Auth, Categories, ExpenseForm, ExpenseList)
│   ├── lib/              # Utility functions, Supabase client, type definitions
│   │   ├── supabaseClient.ts
│   │   └── database.types.ts # Auto-generated Supabase types
│   ├── App.tsx           # Main application component
│   ├── index.css         # Tailwind directives and base styles
│   ├── main.tsx          # Application entry point
│   └── vite-env.d.ts     # Vite environment variable types
├── supabase/
│   └── migrations/       # SQL migration files for database schema
├── .env                  # Environment variables (Supabase URL/Key) - **DO NOT COMMIT**
├── .eslintrc.cjs         # ESLint configuration
├── index.html            # HTML entry point
├── package.json          # Project dependencies and scripts
├── postcss.config.js     # PostCSS configuration (for Tailwind)
├── tailwind.config.js    # Tailwind CSS configuration
├── tsconfig.json         # TypeScript configuration (root)
├── tsconfig.node.json    # TypeScript configuration (for Node env)
└── vite.config.ts        # Vite configuration
```

## Setup and Running Locally

1.  **Clone the repository (if applicable):**
    ```bash
    # Not possible in this environment, but for local setup:
    # git clone <repository-url>
    # cd <project-directory>
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up Supabase:**
    *   Create a project on [Supabase](https://supabase.com/).
    *   In your Supabase project dashboard, go to `SQL Editor` -> `New query`.
    *   Copy the content of each SQL file from the `/supabase/migrations` directory and run them to create the `categories` and `expenses` tables and their policies.
    *   Go to `Project Settings` -> `API`.
    *   Find your Project URL and `anon` public key.

4.  **Configure Environment Variables:**
    *   Make sure you have a `.env` file in the project root.
    *   Add your Supabase credentials to the `.env` file:
        ```env
        VITE_SUPABASE_URL=YOUR_SUPABASE_URL
        VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
        ```
    *   **Important:** The `.env` file provided in this environment uses a shared demo database. For persistent data, use your own Supabase project.

5.  **Generate Supabase Types (Optional but Recommended):**
    *   If you have the Supabase CLI installed locally and are logged in:
        ```bash
        # Make sure SUPABASE_PROJECT_ID is set as an environment variable or replace $SUPABASE_PROJECT_ID
        npm run types:generate
        ```
    *   This updates `src/lib/database.types.ts` based on your database schema.

6.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application should now be running, and you can access it via the URL provided by Vite.

## Potential Feature Improvements

*   **Edit Functionality:** Allow users to edit existing expenses and categories.
*   **Data Visualization:** Implement charts (e.g., pie chart for expenses by category, bar chart for spending over time) using a library like `recharts` (already installed).
*   **Budget Goals:** Allow users to set monthly or category-specific budget goals and track progress.
*   **Reporting:** Generate monthly/yearly spending summaries.
*   **Filtering & Sorting:** Add options to filter expenses by date range, category, or amount, and sort the expense list.
*   **Search:** Implement search functionality for expenses or categories.
*   **User Profile:** Add a section for users to manage their profile (e.g., change password).
*   **Data Export:** Allow users to export their expense data (e.g., to CSV).
*   **Improved UI/UX:** Enhance the user interface, add more visual feedback, and improve form validation.
*   **Mobile Responsiveness:** Ensure the application looks and works well on different screen sizes.
*   **Recurring Expenses:** Add functionality to handle recurring expenses automatically.
*   **Tags/Labels:** Allow adding tags to expenses for more granular tracking.
*   **Household Budgeting:** Allow users to create or join a household, so multiple family members can contribute expenses to a shared budget.
