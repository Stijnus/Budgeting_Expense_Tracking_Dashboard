import React, { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import {
  Mail,
  Lock,
  ChevronRight,
  DollarSign,
  Clock,
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

  return (
    <div className="min-h-screen bg-[#eef2ff]">
      <div className="container mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Column - Landing Page Content */}
          <div className="space-y-8">
            <div className="flex items-center gap-2">
              <Wallet className="h-8 w-8 text-indigo-600" />
              <h1 className="text-2xl font-bold text-gray-900">
                Budget Tracker
              </h1>
            </div>

            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
              Take Control of Your
              <br />
              <span className="text-indigo-600">Financial Future</span>
            </h2>

            <p className="text-xl text-gray-600">
              Track expenses, set budgets, and achieve your financial goals with
              our intuitive budgeting dashboard.
            </p>

            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 h-10 w-10 text-indigo-600">
                  <DollarSign className="h-full w-full" />
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
                <div className="flex-shrink-0 h-10 w-10 text-indigo-600">
                  <Clock className="h-full w-full" />
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
                <div className="flex-shrink-0 h-10 w-10 text-indigo-600">
                  <Bell className="h-full w-full" />
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

          {/* Right Column - Auth Form */}
          <div className="lg:ml-auto w-full max-w-md">
            <div className="bg-white p-8 rounded-lg shadow-lg">
              {showForgotPassword ? (
                <>
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">
                      Reset your password
                    </h2>
                    <p className="mt-2 text-gray-600">
                      Enter your email to receive a reset link
                    </p>
                  </div>

                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Email address
                      </label>
                      <div className="relative">
                        <input
                          id="reset-email"
                          name="email"
                          type="email"
                          required
                          className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          disabled={loading}
                        />
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail className="h-5 w-5 text-gray-400" />
                        </div>
                      </div>
                    </div>

                    {message && (
                      <div
                        className={`p-3 rounded-lg ${
                          message.toLowerCase().includes("error")
                            ? "bg-red-50 text-red-700"
                            : "bg-green-50 text-green-700"
                        }`}
                      >
                        {message}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                      {loading ? "Processing..." : "Send Reset Link"}{" "}
                      {!loading && <ChevronRight className="ml-2 h-4 w-4" />}
                    </button>

                    <p className="text-center mt-4">
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(false)}
                        className="text-indigo-600 hover:text-indigo-500"
                      >
                        Back to {isSignUp ? "sign up" : "sign in"}
                      </button>
                    </p>
                  </form>
                </>
              ) : isSignUp ? (
                <>
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">
                      Create your account
                    </h2>
                    <p className="mt-2 text-gray-600">
                      Start your financial journey today
                    </p>
                  </div>

                  <form onSubmit={handleAuth} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="first-name"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          First Name
                        </label>
                        <div className="relative">
                          <input
                            id="first-name"
                            name="firstName"
                            type="text"
                            required
                            className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            disabled={loading}
                          />
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User className="h-5 w-5 text-gray-400" />
                          </div>
                        </div>
                      </div>
                      <div>
                        <label
                          htmlFor="last-name"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Last Name
                        </label>
                        <div className="relative">
                          <input
                            id="last-name"
                            name="lastName"
                            type="text"
                            required
                            className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            disabled={loading}
                          />
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User className="h-5 w-5 text-gray-400" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="phone"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Phone Number (optional)
                      </label>
                      <div className="relative">
                        <input
                          id="phone"
                          name="phone"
                          type="tel"
                          className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          disabled={loading}
                        />
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Phone className="h-5 w-5 text-gray-400" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Email address
                      </label>
                      <div className="relative">
                        <input
                          id="email"
                          name="email"
                          type="email"
                          required
                          className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          disabled={loading}
                        />
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail className="h-5 w-5 text-gray-400" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="password"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Password
                      </label>
                      <div className="relative">
                        <input
                          id="password"
                          name="password"
                          type="password"
                          required
                          className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          disabled={loading}
                        />
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock className="h-5 w-5 text-gray-400" />
                        </div>
                      </div>
                    </div>

                    {message && (
                      <div
                        className={`p-3 rounded-lg ${
                          message.toLowerCase().includes("error")
                            ? "bg-red-50 text-red-700"
                            : "bg-green-50 text-green-700"
                        }`}
                      >
                        {message}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                      {loading ? "Processing..." : "Create Account"}{" "}
                      {!loading && <ChevronRight className="ml-2 h-4 w-4" />}
                    </button>
                  </form>

                  <p className="text-center mt-6 text-gray-600">
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={toggleAuthMode}
                      className="text-indigo-600 hover:text-indigo-500 font-medium"
                    >
                      Sign In
                    </button>
                  </p>
                </>
              ) : (
                <>
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">
                      Welcome back
                    </h2>
                    <p className="mt-2 text-gray-600">
                      Sign in to continue to your dashboard
                    </p>
                  </div>

                  <form onSubmit={handleAuth} className="space-y-4">
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Email address
                      </label>
                      <div className="relative">
                        <input
                          id="email"
                          name="email"
                          type="email"
                          required
                          className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          disabled={loading}
                        />
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail className="h-5 w-5 text-gray-400" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="password"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Password
                      </label>
                      <div className="relative">
                        <input
                          id="password"
                          name="password"
                          type="password"
                          required
                          className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          disabled={loading}
                        />
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock className="h-5 w-5 text-gray-400" />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(true)}
                        className="text-sm text-indigo-600 hover:text-indigo-500"
                      >
                        Forgot your password?
                      </button>
                    </div>

                    {message && (
                      <div
                        className={`p-3 rounded-lg ${
                          message.toLowerCase().includes("error")
                            ? "bg-red-50 text-red-700"
                            : "bg-green-50 text-green-700"
                        }`}
                      >
                        {message}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                      {loading ? "Processing..." : "Sign In"}{" "}
                      {!loading && <ChevronRight className="ml-2 h-4 w-4" />}
                    </button>
                  </form>

                  <p className="text-center mt-6 text-gray-600">
                    Don't have an account?{" "}
                    <button
                      type="button"
                      onClick={toggleAuthMode}
                      className="text-indigo-600 hover:text-indigo-500 font-medium"
                    >
                      Sign Up
                    </button>
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
