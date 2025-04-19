import { Navigate } from "react-router-dom";
import { useAuth } from "../../../state/auth/useAuth";
import { useEffect, useState } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const [showLoading, setShowLoading] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  useEffect(() => {
    // Only show loading spinner after a short delay to prevent flash
    let timeoutId: number;
    if (loading) {
      timeoutId = window.setTimeout(() => {
        setShowLoading(true);
      }, 500);

      // Set a safety timeout to prevent infinite loading
      const safetyTimeoutId = window.setTimeout(() => {
        console.log(
          "ProtectedRoute: Safety timeout triggered, forcing loading to false"
        );
        setLoadingTimeout(true);
      }, 10000); // 10 second safety timeout

      return () => {
        window.clearTimeout(timeoutId);
        window.clearTimeout(safetyTimeoutId);
      };
    } else {
      setShowLoading(false);
      setLoadingTimeout(false);

      return () => {
        if (timeoutId) {
          window.clearTimeout(timeoutId);
        }
      };
    }
  }, [loading]);

  console.log("ProtectedRoute: Current state:", {
    hasUser: !!user,
    loading,
    showLoading,
    loadingTimeout,
  });

  // If loading timeout has been triggered, proceed as if we have a user
  // This prevents getting stuck in a loading state
  if (loadingTimeout && loading) {
    console.log(
      "ProtectedRoute: Loading timeout triggered, proceeding with children"
    );
    return <>{children}</>;
  }

  if (loading) {
    if (!showLoading) {
      console.log(
        "ProtectedRoute: In loading state, but not showing spinner yet"
      );
      return null; // Return empty to prevent flash
    }
    console.log("ProtectedRoute: Showing loading spinner");
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    console.log("ProtectedRoute: No user found, redirecting to signin");
    return <Navigate to="/signin" replace />;
  }

  console.log(
    "ProtectedRoute: User authenticated, rendering protected content"
  );
  return <>{children}</>;
}
