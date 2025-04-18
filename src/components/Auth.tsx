import React, { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import {
  Mail,
  Lock,
  ArrowRight,
  ChevronRight,
  DollarSign,
  PieChart,
  Bell,
  Wallet,
  User,
  Phone,
} from "lucide-react";
import type { UserProfileUpdate } from "../types/user";

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isSignUp, setIsSignUp] = useState(true); // Toggle between Sign Up and Sign In
  const [message, setMessage] = useState<string | null>(null); // For user feedback
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleAuth = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null); // Clear previous messages

    const credentials = { email, password };

    try {
      let error = null;
      if (isSignUp) {
        // First, sign up the user
        const { data: authData, error: signUpError } =
          await supabase.auth.signUp(credentials);
        error = signUpError;

        if (!error && authData.user) {
          // Then create their profile
          const profile: UserProfileUpdate = {
            first_name: firstName,
            last_name: lastName,
            phone_number: phoneNumber || undefined,
          };

          const { error: profileError } = await supabase
            .from("user_profiles")
            .insert([
              {
                id: authData.user.id,
                ...profile,
                role: "user", // Default role
                email: email,
              },
            ]);

          if (profileError) {
            console.error("Profile creation error:", profileError);
            error = profileError;
          }
        }

        if (!error) setMessage("Check your email for the confirmation link!");
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword(
          credentials
        );
        error = signInError;
        // No message needed on successful sign-in, App.tsx will handle redirect/UI change
      }

      if (error) throw error;
    } catch (error: unknown) {
      console.error("Authentication error:", error);
      setMessage(
        `Error: ${
          error instanceof Error ? error.message : "An unknown error occurred"
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
      if (error) throw error;
      setMessage("Check your email for the password reset link!");
    } catch (error: unknown) {
      console.error("Password reset error:", error);
      setMessage(
        `Error: ${
          error instanceof Error ? error.message : "An unknown error occurred"
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setIsSignUp(!isSignUp);
    setShowForgotPassword(false);
    setMessage(null); // Clear messages when switching modes
    setEmail(""); // Clear fields
    setPassword("");
    setFirstName("");
    setLastName("");
    setPhoneNumber("");
  };

  const renderSignUpFields = () => (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="first-name"
            className="block text-sm font-medium text-gray-700"
          >
            First Name
          </label>
          <div className="mt-1 relative">
            <input
              id="first-name"
              name="firstName"
              type="text"
              required
              className="appearance-none block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              disabled={loading}
            />
            <User className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
          </div>
        </div>
        <div>
          <label
            htmlFor="last-name"
            className="block text-sm font-medium text-gray-700"
          >
            Last Name
          </label>
          <div className="mt-1 relative">
            <input
              id="last-name"
              name="lastName"
              type="text"
              required
              className="appearance-none block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              disabled={loading}
            />
            <User className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
          </div>
        </div>
      </div>
      <div>
        <label
          htmlFor="phone"
          className="block text-sm font-medium text-gray-700"
        >
          Phone Number (optional)
        </label>
        <div className="mt-1 relative">
          <input
            id="phone"
            name="phone"
            type="tel"
            className="appearance-none block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            disabled={loading}
          />
          <Phone className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-white">
      {/* Landing Page Content */}
      <div className="container mx-auto px-4 py-12 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Landing Page Content */}
          <div className="space-y-8">
            <div className="flex items-center gap-2">
              <Wallet className="h-10 w-10 text-indigo-600" />
              <h1 className="text-3xl font-bold text-gray-900">
                Budget Tracker
              </h1>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
              Take Control of Your{" "}
              <span className="text-indigo-600">Financial Future</span>
            </h2>
            <p className="text-xl text-gray-600">
              Track expenses, set budgets, and achieve your financial goals with
              our intuitive budgeting dashboard.
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Expense Tracking
                  </h3>
                  <p className="text-gray-600">
                    Monitor your spending in real-time
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                  <PieChart className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Visual Analytics
                  </h3>
                  <p className="text-gray-600">
                    Understand your finances at a glance
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                  <Bell className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Smart Alerts</h3>
                  <p className="text-gray-600">
                    Stay on top of your budget goals
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Auth Forms */}
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md mx-auto w-full space-y-8">
            {showForgotPassword ? (
              <>
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Reset Password
                  </h2>
                  <p className="mt-2 text-gray-600">
                    Enter your email to receive a reset link
                  </p>
                </div>
                <form onSubmit={handleForgotPassword} className="space-y-6">
                  <div>
                    <label
                      htmlFor="reset-email"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Email address
                    </label>
                    <div className="mt-1 relative">
                      <input
                        id="reset-email"
                        name="email"
                        type="email"
                        required
                        className="appearance-none block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                      />
                      <Mail className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
                    </div>
                  </div>
                  {message && (
                    <p
                      className={`text-sm ${
                        message.startsWith("Error:")
                          ? "text-red-600"
                          : "text-green-600"
                      }`}
                    >
                      {message}
                    </p>
                  )}
                  <div className="flex flex-col space-y-3">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                      {loading ? "Processing..." : "Send Reset Link"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(false)}
                      className="text-sm text-indigo-600 hover:text-indigo-500"
                    >
                      Back to {isSignUp ? "sign up" : "sign in"}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <>
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {isSignUp ? "Create your account" : "Welcome back"}
                  </h2>
                  <p className="mt-2 text-gray-600">
                    {isSignUp
                      ? "Start your financial journey today"
                      : "Sign in to continue to your dashboard"}
                  </p>
                </div>
                <form className="space-y-6" onSubmit={handleAuth}>
                  {isSignUp && renderSignUpFields()}
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Email address
                    </label>
                    <div className="mt-1 relative">
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        className="appearance-none block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                      />
                      <Mail className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Password
                    </label>
                    <div className="mt-1 relative">
                      <input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete={
                          isSignUp ? "new-password" : "current-password"
                        }
                        required
                        minLength={6}
                        className="appearance-none block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                      />
                      <Lock className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
                    </div>
                  </div>
                  {!isSignUp && (
                    <div className="text-right">
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(true)}
                        className="text-sm text-indigo-600 hover:text-indigo-500"
                      >
                        Forgot your password?
                      </button>
                    </div>
                  )}
                  {message && (
                    <p
                      className={`text-sm ${
                        message.startsWith("Error:")
                          ? "text-red-600"
                          : "text-green-600"
                      }`}
                    >
                      {message}
                    </p>
                  )}
                  <div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                      {loading
                        ? "Processing..."
                        : isSignUp
                        ? "Create Account"
                        : "Sign In"}
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </button>
                  </div>
                </form>
                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    {isSignUp
                      ? "Already have an account?"
                      : "Don't have an account?"}{" "}
                    <button
                      type="button"
                      onClick={toggleAuthMode}
                      disabled={loading}
                      className="font-medium text-indigo-600 hover:text-indigo-500 disabled:opacity-50"
                    >
                      {isSignUp ? "Sign In" : "Sign Up"}
                    </button>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
