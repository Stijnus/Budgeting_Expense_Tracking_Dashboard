# Budgeting & Expense Tracking Dashboard

A modern web application that helps users track and manage their personal expenses with ease. Built with React, TypeScript, and Supabase, featuring a beautiful UI and seamless user experience.

## 🌟 Core Features

### 📊 Dashboard

- Overview of spending patterns
- Recent transactions
- Budget progress
- Visual charts and graphs
- Clean and intuitive interface

### 💰 Expense Management

- Add, edit, and delete expenses
- Categorize transactions
- Add notes and tags
- Upload receipts (planned)
- Real-time updates

### 📈 Budgeting

- Set monthly budgets
- Track budget progress
- Get alerts when nearing limits
- View historical budget performance
- Customizable budget categories

### 💼 Bills & Subscriptions

- Track recurring bills and subscriptions
- Set due dates and payment frequencies
- Mark bills as paid
- Get reminders for upcoming payments
- View payment history

### 🎯 Financial Goals

- Set savings and financial goals
- Track progress towards goals
- Set target dates
- Visualize goal completion
- Celebrate achievements

### 🔐 Authentication & User Management

- **Enhanced Login & Registration**:

  - Beautiful landing page with feature highlights
  - Seamless toggle between sign-in and sign-up
  - Password reset functionality
  - Email confirmation flow
  - Form validation and error handling
  - Loading states and user feedback
  - Modern UI with icons and gradients

- **User Profile**:
  - Update email and password
  - Profile customization
  - Account deletion with data cleanup
  - Session management

### 📱 User Experience

- **Modern Interface**:

  - Responsive design for all devices
  - Dark/light theme support
  - Currency preferences
  - Notification settings
  - Intuitive navigation

- **Enhanced Navigation**:
  - Streamlined sidebar with essential links
  - User profile in navbar with avatar
  - Quick access to settings
  - Mobile-friendly menu

## 🛠️ Technical Stack

### Frontend

- **React 18+ with TypeScript**

  - Functional components
  - Custom hooks
  - Context API for state management
  - Type-safe development
  - Feature-based folder structure

- **Styling & UI**
  - Tailwind CSS for styling
  - Lucide React for icons
  - Responsive design patterns
  - CSS Grid and Flexbox layouts
  - Recharts for data visualization

### Backend

- **Supabase**
  - PostgreSQL database
  - Real-time subscriptions
  - Edge Functions
  - Row Level Security (RLS)
  - Authentication services
  - Database migrations
  - Type generation

## 🔒 Security Features

- **Authentication**:

  - Email/password authentication
  - Social login options (planned)
  - Secure password reset flow
  - Session management
  - Email verification

- **Data Protection**:
  - Row Level Security (RLS) policies
  - Secure API endpoints
  - Data encryption
  - Input validation
  - XSS protection

## 🗄️ Database Structure

- **Users**:

  - `user_profiles`: Core user data and profile information
  - `user_settings`: User preferences and settings

- **Financial Data**:

  - `transactions`: Expense and income records
  - `categories`: Transaction categories
  - `budgets`: Budget allocations
  - `tags`: Reusable tags for transactions
  - `transaction_tags`: Junction table linking transactions to tags

- **Bills & Subscriptions**:

  - `bills_subscriptions`: Recurring bills and subscription tracking with frequency, due dates, and payment status

- **Financial Goals**:
  - `financial_goals`: Savings goals with target amounts, current progress, and completion status

## 🔄 Account Management

- **Profile Management**:

  - Email updates
  - Password changes
  - Profile customization
  - Preference settings

- **Account Security**:

  - Two-factor authentication (planned)
  - Session management
  - Login history (planned)

- **Account Deletion**:
  - Self-service removal
  - Data cleanup
  - Cascading deletions
  - Grace period

## 📂 Project Structure

The project follows a feature-based organization pattern for better maintainability and scalability:

```
src/
├── api/                  # API layer
│   ├── supabase/         # Supabase client and API functions
│   │   ├── auth.ts       # Authentication functions
│   │   ├── bills.ts      # Bills & subscriptions functions
│   │   ├── budgets.ts    # Budget management functions
│   │   ├── client.ts     # Supabase client configuration
│   │   ├── expenses.ts   # Expense tracking functions
│   │   ├── goals.ts      # Financial goals functions
│   │   └── index.ts      # API exports
│   └── types/            # API-related type definitions
│       └── database.types.ts # Generated Supabase types
├── components/           # Global components
├── features/             # Feature modules
│   ├── auth/             # Authentication feature
│   │   └── components/   # Auth-related components
│   ├── bills/            # Bills & subscriptions feature
│   │   └── components/   # Bills-related components
│   ├── budgets/          # Budget management feature
│   │   └── components/   # Budget-related components
│   ├── dashboard/        # Dashboard feature
│   │   └── components/   # Dashboard-related components
│   ├── expenses/         # Expense tracking feature
│   │   └── components/   # Expense-related components
│   └── goals/            # Financial goals feature
│       └── components/   # Goals-related components
├── pages/                # Page components
│   ├── AnalyticsPage.tsx       # Analytics and reporting
│   ├── BillsSubscriptionsPage.tsx # Bills and subscriptions management
│   ├── BudgetsPage.tsx         # Budget management
│   ├── CategoriesPage.tsx      # Category management
│   ├── DashboardPage.tsx       # Main dashboard
│   ├── ExpensesPage.tsx        # Expense tracking
│   ├── GoalsPage.tsx           # Financial goals
│   ├── HistoryPage.tsx         # Transaction history
│   ├── IncomePage.tsx          # Income tracking
│   ├── LandingPage.tsx         # Landing/login page
│   ├── NotFoundPage.tsx        # 404 page
│   └── SettingsPage.tsx        # User settings
├── shared/               # Shared utilities and components
│   └── components/       # Shared UI components
│       └── layout/       # Layout components
├── state/                # Global state management
│   ├── auth/             # Auth-related state
│   └── settings/         # Settings-related state
└── utils/                # Utility functions
```

This structure provides several benefits:

- Clear separation of concerns
- Better code organization by feature
- Improved developer experience
- Easier maintenance and scalability
- Better reusability of components

## 🚀 Getting Started

1. **Clone & Setup**:

   ```bash
   git clone https://github.com/Stijnus/Budgeting_Expense_Tracking_Dashboard.git
   cd Budgeting_Expense_Tracking_Dashboard
   ```

2. **Install Dependencies**:

   ```bash
   npm install
   ```

3. **Environment Setup**:

   - Create `.env` file
   - Add required variables:
     ```env
     VITE_SUPABASE_URL=your_supabase_project_url
     VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
     VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
     ```

4. **Development**:

   ```bash
   npm run dev
   ```

5. **Type Checking & Linting**:
   ```bash
   npm run type-check  # Check TypeScript types
   npm run lint        # Run ESLint
   npm run lint:fix    # Fix ESLint issues
   ```

## 🔧 Configuration

### Environment Variables

- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Public API key
- `VITE_SUPABASE_SERVICE_ROLE_KEY`: Admin API key (secure)

### Supabase Setup

1. Create a Supabase project
2. Enable email authentication
3. Configure email templates
4. Set up database tables
5. Apply RLS policies

## 📝 Recent Updates

### Code Reorganization

- **Feature-based Structure**: Reorganized the codebase into a feature-based structure for better maintainability
- **API Layer Separation**: Moved all API-related code to a dedicated `api` directory
- **State Management**: Centralized state management in the `state` directory
- **Shared Components**: Created a `shared` directory for reusable components
- **Page Components**: Separated page components into a dedicated `pages` directory

### New Features

- **Bills & Subscriptions Management**: Added functionality to track recurring bills and subscriptions with frequency options and payment status tracking
- **Financial Goals**: Implemented goal setting and progress tracking with target dates and completion status
- **Transaction Tags System**: Added a comprehensive tagging system for transactions with many-to-many relationships
- **Analytics Dashboard**: Enhanced data visualization with more charts and insights
- **Budget Management**: Added comprehensive budget tracking functionality with category-based budgeting
- **Income Tracking**: Added ability to track and manage income with the same robust features as expenses
- **Expense Categories**: Implemented category management with custom colors for better expense organization
- **Data Visualization**: Added charts for expense categories and spending trends using Recharts
- **Settings Page**: Added user settings for customization including currency preferences

## 🎯 Future Enhancements

### Immediate Roadmap

- **Authentication Improvements**:

  - Social login integration
  - Enhanced password policies
  - Two-factor authentication
  - Login history tracking

- **User Experience**:
  - More customizable themes
  - Keyboard shortcuts
  - Improved loading states
  - Enhanced error handling

### Planned Features

- **Data & Analytics**:

  - Advanced reporting
  - Data export options
  - Custom dashboards
  - Trend analysis

- **Automation**:

  - Recurring transactions
  - Automated categorization
  - Smart budgeting suggestions
  - Email reports

- **Integration & Extensions**:

  - Bank account connections
  - Receipt OCR
  - Mobile apps
  - Browser extensions

- **Social Features**:
  - Shared budgets
  - Shared financial goals
  - Community tips
  - Achievement system

## 📝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

See our contributing guidelines for more details.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Supabase team for the excellent backend platform
- Tailwind CSS for the styling framework
- Lucide for the beautiful icons
- Our contributors and users
