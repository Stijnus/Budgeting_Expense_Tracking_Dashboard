// src/components/UserProfile.tsx
import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Loader2, AlertTriangle, CheckCircle, UserCog } from 'lucide-react';

export default function UserProfile() {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const handlePasswordChange = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);
        setSuccessMessage(null);

        // Validation
        if (!newPassword) {
            setError('New password cannot be empty.');
            return;
        }
        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);

        try {
            const { error: updateError } = await supabase.auth.updateUser({
                password: newPassword,
            });

            if (updateError) throw updateError;

            setSuccessMessage('Password updated successfully!');
            setNewPassword('');
            setConfirmPassword('');
            // Clear success message after a few seconds
            setTimeout(() => setSuccessMessage(null), 4000);

        } catch (err: any) {
            console.error('Error updating password:', err);
            setError(`Failed to update password: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 bg-white rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
                <UserCog size={20} className="text-gray-600" /> User Profile
            </h2>

            <div className="mt-4 pt-4 border-t border-gray-200">
                <h3 className="text-md font-semibold mb-3 text-gray-700">Change Password</h3>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div>
                        <label
                            htmlFor="new-password"
                            className="block text-sm font-medium text-gray-700"
                        >
                            New Password
                        </label>
                        <input
                            id="new-password"
                            name="new-password"
                            type="password"
                            autoComplete="new-password"
                            required
                            minLength={6}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            disabled={loading}
                        />
                         <p className="mt-1 text-xs text-gray-500">Must be at least 6 characters long.</p>
                    </div>
                    <div>
                        <label
                            htmlFor="confirm-password"
                            className="block text-sm font-medium text-gray-700"
                        >
                            Confirm New Password
                        </label>
                        <input
                            id="confirm-password"
                            name="confirm-password"
                            type="password"
                            autoComplete="new-password"
                            required
                            minLength={6}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            disabled={loading}
                        />
                    </div>

                    {/* Feedback Messages */}
                    {error && (
                        <p className="text-sm text-red-600 flex items-center gap-1">
                            <AlertTriangle size={16} /> {error}
                        </p>
                    )}
                    {successMessage && (
                        <p className="text-sm text-green-600 flex items-center gap-1">
                            <CheckCircle size={16} /> {successMessage}
                        </p>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={loading || !newPassword || newPassword !== confirmPassword}
                            className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 flex items-center justify-center"
                        >
                            {loading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
                            {loading ? 'Updating...' : 'Update Password'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
