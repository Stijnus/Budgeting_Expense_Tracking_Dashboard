import { useState, useEffect } from "react";
import { useAuth } from "../state/auth/useAuth";
import {
  diagnoseSessionIssues,
  fixSessionIssues,
  clearAuthData,
  cleanupAuthData,
  checkAndFixAuthState,
} from "../utils/auth-debug";

/**
 * A debug component for diagnosing and fixing authentication issues
 * This should only be used during development
 */
export default function AuthDebug() {
  const { user, profile, loading } = useAuth();
  const [diagnosticResults, setDiagnosticResults] = useState<any>(null);
  const [fixResults, setFixResults] = useState<any>(null);
  const [clearResults, setClearResults] = useState<any>(null);
  const [cleanupResults, setCleanupResults] = useState<any>(null);
  const [checkResults, setCheckResults] = useState<any>(null);
  const [showDebug, setShowDebug] = useState(false);

  // Run a check on component mount to automatically fix auth issues
  useEffect(() => {
    const autoCheck = async () => {
      try {
        const results = await checkAndFixAuthState();
        if (results.fixed) {
          console.log("Auto-fixed auth state:", results.action);
        }
      } catch (error) {
        console.error("Error in auto auth check:", error);
      }
    };

    autoCheck();

    // Set up periodic checks
    const intervalId = setInterval(async () => {
      try {
        const results = await checkAndFixAuthState();
        if (results.fixed) {
          console.log("Periodic auth check fixed issues:", results.action);
        }
      } catch (error) {
        console.error("Error in periodic auth check:", error);
      }
    }, 60000); // Check every minute

    return () => clearInterval(intervalId);
  }, []);

  const runDiagnostics = async () => {
    const results = await diagnoseSessionIssues();
    setDiagnosticResults(results);
  };

  const attemptFix = async () => {
    const results = await fixSessionIssues();
    setFixResults(results);
  };

  const clearAuth = () => {
    const results = clearAuthData();
    setClearResults(results);
  };

  const cleanupAuth = () => {
    const results = cleanupAuthData();
    setCleanupResults(results);
  };

  const checkAuth = async () => {
    const results = await checkAndFixAuthState();
    setCheckResults(results);
  };

  if (!showDebug) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setShowDebug(true)}
          className="bg-gray-800 text-white px-3 py-1 rounded-md text-xs"
        >
          Debug
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white p-4 rounded-lg shadow-lg border border-gray-200 w-96 max-h-[80vh] overflow-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg">Auth Debug</h3>
        <button
          onClick={() => setShowDebug(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      <div className="mb-4">
        <h4 className="font-semibold mb-2">Current Auth State</h4>
        <div className="bg-gray-100 p-2 rounded text-xs font-mono">
          <div>User: {user ? "Authenticated" : "Not authenticated"}</div>
          <div>User ID: {user?.id || "None"}</div>
          <div>Email: {user?.email || "None"}</div>
          <div>Profile: {profile ? "Loaded" : "Not loaded"}</div>
          <div>Loading: {loading ? "True" : "False"}</div>
        </div>
      </div>

      <div className="space-y-2">
        <button
          onClick={runDiagnostics}
          className="w-full bg-blue-600 text-white px-3 py-2 rounded-md text-sm"
        >
          Run Diagnostics
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={attemptFix}
            className="bg-green-600 text-white px-3 py-2 rounded-md text-sm"
          >
            Attempt Fix
          </button>

          <button
            onClick={checkAuth}
            className="bg-indigo-600 text-white px-3 py-2 rounded-md text-sm"
          >
            Check & Fix
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={cleanupAuth}
            className="bg-yellow-600 text-white px-3 py-2 rounded-md text-sm"
          >
            Cleanup Auth
          </button>

          <button
            onClick={clearAuth}
            className="bg-red-600 text-white px-3 py-2 rounded-md text-sm"
          >
            Clear Auth
          </button>
        </div>
      </div>

      {diagnosticResults && (
        <div className="mt-4">
          <h4 className="font-semibold mb-2">Diagnostic Results</h4>
          <div className="bg-gray-100 p-2 rounded text-xs font-mono overflow-auto max-h-40">
            <pre>{JSON.stringify(diagnosticResults, null, 2)}</pre>
          </div>
        </div>
      )}

      {fixResults && (
        <div className="mt-4">
          <h4 className="font-semibold mb-2">Fix Results</h4>
          <div className="bg-gray-100 p-2 rounded text-xs font-mono overflow-auto max-h-40">
            <pre>{JSON.stringify(fixResults, null, 2)}</pre>
          </div>
        </div>
      )}

      {clearResults && (
        <div className="mt-4">
          <h4 className="font-semibold mb-2">Clear Results</h4>
          <div className="bg-gray-100 p-2 rounded text-xs font-mono overflow-auto max-h-40">
            <pre>{JSON.stringify(clearResults, null, 2)}</pre>
          </div>
        </div>
      )}

      {cleanupResults && (
        <div className="mt-4">
          <h4 className="font-semibold mb-2">Cleanup Results</h4>
          <div className="bg-gray-100 p-2 rounded text-xs font-mono overflow-auto max-h-40">
            <pre>{JSON.stringify(cleanupResults, null, 2)}</pre>
          </div>
        </div>
      )}

      {checkResults && (
        <div className="mt-4">
          <h4 className="font-semibold mb-2">Check & Fix Results</h4>
          <div className="bg-gray-100 p-2 rounded text-xs font-mono overflow-auto max-h-40">
            <pre>{JSON.stringify(checkResults, null, 2)}</pre>
          </div>
        </div>
      )}

      <div className="mt-4 text-xs text-gray-500">
        This debug panel is for development use only.
      </div>
    </div>
  );
}
