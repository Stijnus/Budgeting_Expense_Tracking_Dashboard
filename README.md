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

- **Styling & UI**
  - Tailwind CSS for styling
  - Lucide React for icons
  - Responsive design patterns
  - CSS Grid and Flexbox layouts

### Backend

- **Supabase**
  - PostgreSQL database
  - Real-time subscriptions
  - Edge Functions
  - Row Level Security (RLS)
  - Authentication services

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

  - Core user data
  - Profile preferences
  - Authentication details
  - Account settings

- **Financial Data**:
  - Expenses
  - Categories
  - Budgets
  - Tags
  - Transaction history

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

## 🚀 Getting Started

1. **Clone & Setup**:

   ```bash
   git clone <repository-url>
   cd <project-directory>
   ```

2. **Install Dependencies**:

   ```bash
   npm install
   ```

3. **Environment Setup**:

   - Create `.env` file
   - Add required variables:
     ```env
     SUPABASE_URL=your_supabase_project_url
     SUPABASE_ANON_KEY=your_supabase_anon_key
     SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
     ```

4. **Development**:
   ```bash
   npm run dev
   ```

## 🔧 Configuration

### Environment Variables

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Public API key
- `SUPABASE_SERVICE_ROLE_KEY`: Admin API key (secure)

### Supabase Setup

1. Create a Supabase project
2. Enable email authentication
3. Configure email templates
4. Set up database tables
5. Apply RLS policies

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
  - Financial goals
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
