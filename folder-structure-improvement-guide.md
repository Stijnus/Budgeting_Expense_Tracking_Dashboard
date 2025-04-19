# Folder Structure Improvement Guide

This guide outlines the steps to reorganize the Budgeting & Expense Tracking Dashboard codebase for better maintainability and scalability.

## Current Issues

1. **Inconsistent component organization**: Some components are directly in the components folder while others are in subfolders
2. **Feature-related files are scattered**: Files related to the same feature (e.g., budgeting) are spread across different directories
3. **Page components mixed with UI components**: Dashboard is treated as a component rather than a page
4. **Inconsistent naming conventions**: Some files use PascalCase, others use kebab-case
5. **Lack of clear organization for feature-specific components**

## New Folder Structure

```
src/
├── api/                       # API-related code
│   ├── supabase/              # Supabase-specific code
│   │   ├── client.ts          # Supabase client setup
│   │   ├── auth.ts            # Auth-related API functions
│   │   ├── expenses.ts        # Expense-related API functions
│   │   └── budgets.ts         # Budget-related API functions
│   └── types/                 # API-related types
├── features/                  # Feature-based organization
│   ├── auth/                  # Authentication feature
│   │   ├── components/        # Auth-specific components
│   │   ├── hooks/             # Auth-specific hooks
│   │   ├── types/             # Auth-specific types
│   │   └── utils/             # Auth-specific utilities
│   ├── dashboard/             # Dashboard feature
│   │   ├── components/        # Dashboard-specific components
│   │   └── hooks/             # Dashboard-specific hooks
│   ├── expenses/              # Expense tracking feature
│   │   ├── components/        # Expense-specific components
│   │   ├── hooks/             # Expense-specific hooks
│   │   └── types/             # Expense-specific types
│   └── budgets/               # Budget management feature
│       ├── components/        # Budget-specific components
│       ├── hooks/             # Budget-specific hooks
│       └── types/             # Budget-specific types
├── pages/                     # Top-level route components
│   ├── LandingPage.tsx        # Landing/home page
│   ├── DashboardPage.tsx      # Main dashboard page
│   ├── ExpensesPage.tsx       # Expenses management page
│   ├── BudgetsPage.tsx        # Budget management page
│   ├── SettingsPage.tsx       # User settings page
│   └── NotFoundPage.tsx       # 404 page
├── shared/                    # Shared/common code
│   ├── components/            # Reusable UI components
│   │   ├── buttons/           # Button components
│   │   ├── forms/             # Form components
│   │   ├── layout/            # Layout components
│   │   └── modals/            # Modal components
│   ├── hooks/                 # Common hooks
│   ├── types/                 # Common types
│   └── utils/                 # Common utilities
└── state/                     # Global state management
    ├── auth/                  # Auth state
    │   ├── AuthContext.tsx    # Auth context provider
    │   ├── auth-context.ts    # Auth context type definitions
    │   └── useAuth.ts         # Auth hook
    ├── settings/              # Settings state
    │   ├── SettingsContext.tsx # Settings context provider
    │   └── useSettings.ts     # Settings hook
    └── index.ts               # Export all providers
```

## Implementation Steps

### 1. Create the New Directory Structure

```bash
# Create API directories
mkdir -p src/api/supabase
mkdir -p src/api/types

# Create feature directories
mkdir -p src/features/auth/components
mkdir -p src/features/auth/hooks
mkdir -p src/features/auth/types
mkdir -p src/features/auth/utils
mkdir -p src/features/dashboard/components
mkdir -p src/features/dashboard/hooks
mkdir -p src/features/expenses/components
mkdir -p src/features/expenses/hooks
mkdir -p src/features/expenses/types
mkdir -p src/features/budgets/components
mkdir -p src/features/budgets/hooks
mkdir -p src/features/budgets/types

# Create pages directory
mkdir -p src/pages

# Create shared directories
mkdir -p src/shared/components/buttons
mkdir -p src/shared/components/forms
mkdir -p src/shared/components/layout
mkdir -p src/shared/components/modals
mkdir -p src/shared/hooks
mkdir -p src/shared/types
mkdir -p src/shared/utils

# Create state management directories
mkdir -p src/state/auth
mkdir -p src/state/settings
```

### 2. File Migration Plan

#### 2.1 API Layer Migration

| Current Location | New Location | Notes |
|------------------|--------------|-------|
| `src/lib/supabase.ts` | `src/api/supabase/client.ts` | Supabase client setup |
| `src/lib/supabaseClient.ts` | `src/api/supabase/client.ts` | Merge with above if duplicate |
| `src/lib/database.types.ts` | `src/api/types/database.types.ts` | Database type definitions |

Create the following new files:
- `src/api/supabase/auth.ts` - Auth-related API functions
- `src/api/supabase/expenses.ts` - Expense-related API functions
- `src/api/supabase/budgets.ts` - Budget-related API functions
- `src/api/supabase/index.ts` - Barrel file to export all API functions

#### 2.2 Authentication Feature Migration

| Current Location | New Location | Notes |
|------------------|--------------|-------|
| `src/components/auth/LandingPage.tsx` | `src/pages/LandingPage.tsx` | Move to pages |
| `src/components/auth/SignIn.tsx` | `src/features/auth/components/SignIn.tsx` | |
| `src/components/auth/SignUp.tsx` | `src/features/auth/components/SignUp.tsx` | |
| `src/components/auth/ProtectedRoute.tsx` | `src/features/auth/components/ProtectedRoute.tsx` | |
| `src/components/auth/AuthForm.tsx` | `src/features/auth/components/AuthForm.tsx` | |

Create `src/features/auth/components/index.ts` to export all auth components.

#### 2.3 State Management Migration

| Current Location | New Location | Notes |
|------------------|--------------|-------|
| `src/contexts/AuthContext.tsx` | `src/state/auth/AuthContext.tsx` | |
| `src/contexts/auth-context.ts` | `src/state/auth/auth-context.ts` | |
| `src/hooks/useAuth.ts` | `src/state/auth/useAuth.ts` | |
| `src/contexts/SettingsContext.tsx` | `src/state/settings/SettingsContext.tsx` | |
| `src/contexts/settings-context.ts` | `src/state/settings/settings-context.ts` | |
| `src/hooks/useSettings.ts` | `src/state/settings/useSettings.ts` | |

Create `src/state/index.ts` to export all providers.

#### 2.4 Dashboard Feature Migration

| Current Location | New Location | Notes |
|------------------|--------------|-------|
| `src/components/Dashboard.tsx` | `src/pages/DashboardPage.tsx` | Move to pages |

Create dashboard-specific components in `src/features/dashboard/components/` as needed.

#### 2.5 Expenses Feature Migration

| Current Location | New Location | Notes |
|------------------|--------------|-------|
| `src/components/ExpenseList.tsx` | `src/features/expenses/components/ExpenseList.tsx` | |
| `src/components/EditExpenseModal.tsx` | `src/features/expenses/components/EditExpenseModal.tsx` | |

Create `src/pages/ExpensesPage.tsx` to use these components.
Create `src/features/expenses/components/index.ts` to export all expense components.

#### 2.6 Budget Feature Migration

| Current Location | New Location | Notes |
|------------------|--------------|-------|
| `src/components/BudgetManager.tsx` | `src/features/budgets/components/BudgetManager.tsx` | |
| `src/components/MonthlyReport.tsx` | `src/features/budgets/components/MonthlyReport.tsx` | |

Create `src/pages/BudgetsPage.tsx` to use these components.
Create `src/features/budgets/components/index.ts` to export all budget components.

#### 2.7 Shared Components Migration

| Current Location | New Location | Notes |
|------------------|--------------|-------|
| `src/components/layout/AppLayout.tsx` | `src/shared/components/layout/AppLayout.tsx` | |
| `src/components/layout/Navbar.tsx` | `src/shared/components/layout/Navbar.tsx` | |
| `src/components/layout/Sidebar.tsx` | `src/shared/components/layout/Sidebar.tsx` | |
| `src/components/layout/Footer.tsx` | `src/shared/components/layout/Footer.tsx` | |

Create `src/shared/components/layout/index.ts` to export all layout components.

### 3. Update App.tsx

After migrating all files, update `src/App.tsx` to use the new structure:

```tsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./state/auth/AuthContext";
import { SettingsProvider } from "./state/settings/SettingsContext";
import { ProtectedRoute } from "./features/auth/components/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import DashboardPage from "./pages/DashboardPage";
import ExpensesPage from "./pages/ExpensesPage";
import BudgetsPage from "./pages/BudgetsPage";
import SettingsPage from "./pages/SettingsPage";
import NotFoundPage from "./pages/NotFoundPage";

function App() {
  return (
    <Router>
      <AuthProvider>
        <SettingsProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/signin" element={<LandingPage />} />
            <Route path="/signup" element={<LandingPage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/expenses"
              element={
                <ProtectedRoute>
                  <ExpensesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/budgets"
              element={
                <ProtectedRoute>
                  <BudgetsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </SettingsProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
```

### 4. Create New Page Components

For each new page, create a basic structure. Example for `src/pages/DashboardPage.tsx`:

```tsx
import { useAuth } from "../state/auth/useAuth";
import { AppLayout } from "../shared/components/layout";
// Import dashboard-specific components
import { DashboardSummary, RecentActivity } from "../features/dashboard/components";

export default function DashboardPage() {
  const { user, profile } = useAuth();
  
  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
        <DashboardSummary />
        <RecentActivity />
      </div>
    </AppLayout>
  );
}
```

### 5. Create Barrel Files (index.ts)

Create index.ts files in each directory to simplify imports. Example for `src/features/auth/components/index.ts`:

```ts
export { default as SignIn } from './SignIn';
export { default as SignUp } from './SignUp';
export { default as ProtectedRoute } from './ProtectedRoute';
export { default as AuthForm } from './AuthForm';
```

### 6. Update Import Statements

As you move each file, update all import statements to reflect the new file locations. Use relative paths for imports within the same feature, and absolute paths for imports across features.

## File Naming Conventions

- **Component files**: Use PascalCase (e.g., `ExpenseList.tsx`)
- **Utility files**: Use kebab-case (e.g., `date-utils.ts`)
- **Hook files**: Use camelCase with 'use' prefix (e.g., `useAuth.ts`)
- **Context files**: Use PascalCase for provider components (e.g., `AuthContext.tsx`) and kebab-case for type definitions (e.g., `auth-context.ts`)

## Testing Strategy

1. Migrate one feature at a time
2. Test the application after each feature migration
3. Fix any import issues before moving to the next feature
4. Run a full application test after completing all migrations

## Benefits of the New Structure

- **Better organization**: Related code is grouped together by feature
- **Easier navigation**: Developers can quickly find files related to a specific feature
- **Improved scalability**: New features can be added without cluttering existing directories
- **Better separation of concerns**: Clear distinction between pages, components, and services
- **Simplified imports**: Barrel files reduce import complexity
- **More maintainable**: Easier to understand the codebase structure at a glance
- **Facilitates code splitting**: Feature-based organization aligns well with code splitting
