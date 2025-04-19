import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  DollarSign,
  Clock,
  Bell,
  User,
  Mail,
  Lock,
  Phone,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../state/auth/useAuth";

interface LandingPageProps {
  initialMode?: "signin" | "signup";
}

export default function LandingPage({ initialMode }: LandingPageProps) {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(initialMode !== "signin");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const { signIn, signUp, resetPassword, clearSession } = useAuth();

  // Update isSignUp when initialMode changes
  useEffect(() => {
    if (initialMode === "signin") {
      setIsSignUp(false);
    } else if (initialMode === "signup") {
      setIsSignUp(true);
    }
  }, [initialMode]);

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password, {
          data: {
            first_name: firstName,
            last_name: lastName,
          },
          // Store phone number in metadata or user profile table instead
        });

        if (error) throw error;
        setMessage(
          "Registration successful! Please check your email for confirmation."
        );
      } else {
        console.log("Starting login process...");
        // Clear any existing session before attempting to sign in
        // This helps prevent issues with stale sessions
        console.log("Clearing existing session...");
        clearSession();

        console.log("Attempting to sign in...");
        const { error } = await signIn(email, password);
        if (error) {
          console.error("Sign in error:", error);
          throw error;
        }

        // Successfully logged in, wait a bit for auth state to update
        console.log("Sign in successful, waiting for auth state to update...");
        await new Promise((resolve) => setTimeout(resolve, 500));
        console.log("Navigating to dashboard...");
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Authentication error:", error);
      setMessage(
        `Error: ${
          error instanceof Error ? error.message : "An unknown error occurred"
        }`
      );
    } finally {
      console.log("Auth process complete, setting loading to false");
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const { error } = await resetPassword(email);
      if (error) throw error;
      setMessage("Password reset instructions sent to your email.");
    } catch (error) {
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
    setMessage(null);
    // Reset form fields
    setEmail("");
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
              <DollarSign className="h-8 w-8 text-indigo-600" />
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
                          autoComplete="new-password"
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
                          autoComplete="current-password"
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
