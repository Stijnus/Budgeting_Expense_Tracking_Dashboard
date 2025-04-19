import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import {
  Mail,
  Lock,
  User,
  DollarSign,
  Loader2,
  ChevronLeft,
  Github,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

type AuthMode = "signin" | "signup" | "forgot-password";

export function AuthForm() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [registrationComplete, setRegistrationComplete] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
  });

  useEffect(() => {
    // Check for email confirmation success
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get("type");

    if (type === "signup") {
      setSuccess("Email confirmed! You can now sign in with your credentials.");
      // Remove the hash from the URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (mode === "signin") {
        try {
          await signIn(formData.email, formData.password);
        } catch (err) {
          console.error("Sign in error:", err);
          if (err instanceof Error) {
            if (err.message.includes("Email not confirmed")) {
              throw new Error(
                "Please check your email and confirm your account before signing in."
              );
            } else if (err.message.includes("Invalid login credentials")) {
              throw new Error(
                "Invalid email or password. Please check your credentials and try again."
              );
            } else if (err.message.includes("rate limit")) {
              throw new Error("Too many attempts. Please try again later.");
            }
            throw err;
          }
        }
      } else if (mode === "signup") {
        try {
          await signUp(formData.email, formData.password, {
            data: {
              first_name: formData.firstName,
              last_name: formData.lastName,
            },
          });
          setSuccess(
            "Registration successful! Please check your email for confirmation and sign in with your credentials."
          );
          setRegistrationComplete(true);
          // Clear form data
          setFormData({
            email: "",
            password: "",
            firstName: "",
            lastName: "",
          });
          // Redirect to sign in after 3 seconds
          setTimeout(() => {
            setMode("signin");
            setSuccess(null);
            setRegistrationComplete(false);
          }, 3000);
        } catch (err) {
          console.error("Sign up error:", err);
          if (err instanceof Error) {
            if (err.message.includes("already registered")) {
              throw new Error(
                "This email is already registered. Please try signing in instead."
              );
            }
            throw err;
          }
        }
      } else if (mode === "forgot-password") {
        const { error } = await supabase.auth.resetPasswordForEmail(
          formData.email,
          {
            redirectTo: `${window.location.origin}/reset-password`,
          }
        );
        if (error) throw error;
        setSuccess("Password reset instructions have been sent to your email.");
      }
    } catch (err) {
      console.error("Form submission error:", err);
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center relative">
          {mode !== "signin" && !registrationComplete && (
            <button
              onClick={() => setMode("signin")}
              className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-500 hover:text-indigo-600 transition-colors duration-200 flex items-center gap-1 text-sm"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>
          )}
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-3 rounded-2xl shadow-lg transform hover:scale-105 transition-transform duration-200">
              <DollarSign className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-indigo-800 mb-2">
            Budget Tracker
          </h1>
          <h2 className="text-xl text-gray-600 mb-8">
            {mode === "signin" && "Welcome back! Sign in to continue"}
            {mode === "signup" &&
              !registrationComplete &&
              "Get started with your financial journey"}
            {mode === "forgot-password" && "Reset your password"}
          </h2>
        </div>

        <div className="bg-white/80 backdrop-blur-xl p-8 rounded-2xl shadow-2xl space-y-6 border border-gray-100">
          {registrationComplete ? (
            <div className="text-center space-y-4">
              <div className="text-green-600 font-medium text-lg">
                {success}
              </div>
              <div className="text-gray-500">Redirecting to sign in...</div>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors duration-200" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/50 backdrop-blur-xl transition-all duration-200"
                    placeholder="Email address"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </div>

                {mode !== "forgot-password" && (
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors duration-200" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/50 backdrop-blur-xl transition-all duration-200"
                      placeholder="Password"
                      value={formData.password}
                      onChange={handleInputChange}
                    />
                  </div>
                )}

                {mode === "signup" && (
                  <>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors duration-200" />
                      </div>
                      <input
                        id="firstName"
                        name="firstName"
                        type="text"
                        required
                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/50 backdrop-blur-xl transition-all duration-200"
                        placeholder="First name"
                        value={formData.firstName}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors duration-200" />
                      </div>
                      <input
                        id="lastName"
                        name="lastName"
                        type="text"
                        required
                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/50 backdrop-blur-xl transition-all duration-200"
                        placeholder="Last name"
                        value={formData.lastName}
                        onChange={handleInputChange}
                      />
                    </div>
                  </>
                )}
              </div>

              {error && (
                <div className="text-red-600 text-sm text-center bg-red-50 p-4 rounded-xl border border-red-100">
                  {error}
                </div>
              )}

              {success && !registrationComplete && (
                <div className="text-green-600 text-sm text-center bg-green-50 p-4 rounded-xl border border-green-100">
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center px-4 py-2.5 border border-transparent text-base font-medium rounded-xl text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                    Processing...
                  </>
                ) : mode === "signin" ? (
                  "Sign in"
                ) : mode === "signup" ? (
                  "Create account"
                ) : (
                  "Reset password"
                )}
              </button>

              {mode === "signin" && (
                <>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">
                        Or continue with
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <Mail className="h-5 w-5" />
                      Google
                    </button>
                    <button
                      type="button"
                      className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <Github className="h-5 w-5" />
                      GitHub
                    </button>
                  </div>
                </>
              )}

              <div className="text-sm text-center space-y-2">
                {mode === "signin" && (
                  <button
                    type="button"
                    onClick={() => setMode("forgot-password")}
                    className="text-indigo-600 hover:text-indigo-500 transition-colors duration-200"
                  >
                    Forgot your password?
                  </button>
                )}
                <div>
                  <button
                    type="button"
                    onClick={() =>
                      setMode(mode === "signin" ? "signup" : "signin")
                    }
                    className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors duration-200"
                  >
                    {mode === "signin"
                      ? "Don't have an account? Sign up"
                      : "Already have an account? Sign in"}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
