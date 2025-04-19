import React, { useEffect, useState } from "react";
import { supabase } from "../../../api/supabase/client";
import { CheckCircle2, XCircle } from "lucide-react";

interface ActivatedUser {
  id: string;
  email: string;
  last_sign_in_at: string | null;
  created_at: string;
  is_active: boolean;
}

const ActivatedUsersList: React.FC = () => {
  const [users, setUsers] = useState<ActivatedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  useEffect(() => {
    checkAdminStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAdminStatus = async () => {
    try {
      const {
        data: { user: currentUser },
        error: authError,
      } = await supabase.auth.getUser();
      console.log("Current user:", currentUser);

      if (authError) {
        console.error("Auth error:", authError);
        setError("Authentication error. Please try logging in again.");
        setLoading(false);
        return;
      }

      if (!currentUser) {
        setError("You must be logged in to view this list");
        setLoading(false);
        return;
      }

      // Check if the current user is an admin
      console.log("Calling is_admin with user_id:", currentUser.id);
      const { data: adminCheck, error: adminError } = await supabase.rpc(
        "is_admin",
        { user_id: currentUser.id }
      );

      console.log("Admin check result:", {
        adminCheck,
        adminError,
        currentUserId: currentUser.id,
        functionCall: "is_admin",
        parameters: { user_id: currentUser.id },
      });

      if (adminError) {
        console.error("Error checking admin status:", adminError);
        setError("Error checking permissions. Please try again later.");
        setLoading(false);
        return;
      }

      setIsAdmin(adminCheck);
      if (adminCheck) {
        fetchUsers();
      } else {
        setError("You do not have admin permissions to view this list");
        setLoading(false);
      }
    } catch (error) {
      console.error("Error in checkAdminStatus:", error);
      setError("An unexpected error occurred. Please try again later.");
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("auth.users")
        .select("id, email, last_sign_in_at, created_at, is_active")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setUsers(data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      setError("Failed to load users. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
          {!isAdmin && (
            <p className="text-sm text-red-500 mt-2">
              Please contact an administrator if you believe this is an error.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Activated Users</h3>
        <span className="text-sm text-gray-500">{users.length} users</span>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Sign In
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created At
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-600 font-medium">
                          {user.email.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {user.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {user.is_active ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <span className="ml-2 text-sm text-gray-900">
                      {user.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.last_sign_in_at
                    ? formatDate(user.last_sign_in_at)
                    : "Never"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(user.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ActivatedUsersList;
