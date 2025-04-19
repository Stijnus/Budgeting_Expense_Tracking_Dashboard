// src/features/auth/components/UserProfile.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../../api/supabase/client';
import { Loader2, AlertTriangle, CheckCircle, UserCog, Trash2, ShieldAlert } from 'lucide-react';

export default function UserProfile() {
    // --- Password Change State ---
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [passwordSuccessMessage, setPasswordSuccessMessage] = useState<string | null>(null);

    // --- Account Deletion State ---
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteConfirmEmail, setDeleteConfirmEmail] = useState('');
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);

    // Fetch current user's email on component mount for confirmation check
    useEffect(() => {
        const fetchUserEmail = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUserEmail(user?.email ?? null);
        };
        fetchUserEmail();
    }, []);

    const handlePasswordChange = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setPasswordError(null);
        setPasswordSuccessMessage(null);

        if (!newPassword) { setPasswordError('New password cannot be empty.'); return; }
        if (newPassword.length < 6) { setPasswordError('Password must be at least 6 characters long.'); return; }
        if (newPassword !== confirmPassword) { setPasswordError('Passwords do not match.'); return; }

        setPasswordLoading(true);
        try {
            const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
            if (updateError) throw updateError;
            setPasswordSuccessMessage('Password updated successfully!');
            setNewPassword(''); setConfirmPassword('');
            setTimeout(() => setPasswordSuccessMessage(null), 4000);
        } catch (err: any) {
            console.error('Error updating password:', err);
            setPasswordError(`Failed to update password: ${err.message}`);
        } finally {
            setPasswordLoading(false);
        }
    };

    // --- Account Deletion Handlers ---
    const openDeleteModal = () => {
        setDeleteConfirmEmail(''); // Reset confirmation field
        setDeleteError(null); // Clear previous errors
        setIsDeleteModalOpen(true);
    };

    const closeDeleteModal = () => {
        if (deleteLoading) return; // Don't close while deleting
        setIsDeleteModalOpen(false);
    };

    const handleDeleteAccount = async () => {
        if (deleteConfirmEmail.toLowerCase() !== currentUserEmail?.toLowerCase()) {
            setDeleteError('Confirmation email does not match.');
            return;
        }
        setDeleteLoading(true);
        setDeleteError(null);

        try {
            // 1. First delete all user data from related tables
            const { data: { user }, error: getUserError } = await supabase.auth.getUser();
            if (getUserError || !user?.id) throw new Error('Could not authenticate user');
            
            const { error: deleteDataError } = await supabase
                .from('household_members')
                .delete()
                .eq('user_id', user.id);

            if (deleteDataError) throw deleteDataError;

            // 2. Then delete the auth user
            const { error: deleteUserError } = await supabase.rpc('delete_user', {});

            if (deleteUserError) throw deleteUserError;

            // 3. Finally sign out
            await supabase.auth.signOut();
            
        } catch (err: any) {
            console.error('Error deleting account:', err);
            setDeleteError(`Failed to delete account: ${err.message}`);
        } finally {
            setDeleteLoading(false);
        }
    };

    // --- Render ---
    return (
        <>
            <div className="p-4 bg-white rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
                    <UserCog size={20} className="text-gray-600" /> User Profile
                </h2>

                {/* Change Password Section */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                    <h3 className="text-md font-semibold mb-3 text-gray-700">Change Password</h3>
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                        <div>
                            <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                            <input 
                                id="new-password" 
                                type="password" 
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                value={newPassword} 
                                onChange={(e) => setNewPassword(e.target.value)} 
                                disabled={passwordLoading} 
                            />
                            <p className="mt-1 text-xs text-gray-500">Must be at least 6 characters long.</p>
                        </div>
                        <div>
                            <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                            <input 
                                id="confirm-password" 
                                type="password" 
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                value={confirmPassword} 
                                onChange={(e) => setConfirmPassword(e.target.value)} 
                                disabled={passwordLoading} 
                            />
                        </div>
                        {/* Feedback Messages */}
                        {passwordError && (<p className="text-sm text-red-600 flex items-center gap-1"><AlertTriangle size={16} /> {passwordError}</p>)}
                        {passwordSuccessMessage && (<p className="text-sm text-green-600 flex items-center gap-1"><CheckCircle size={16} /> {passwordSuccessMessage}</p>)}
                        {/* Submit Button */}
                        <div>
                            <button 
                                type="submit" 
                                disabled={passwordLoading || !newPassword || newPassword !== confirmPassword}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                            >
                                {passwordLoading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
                                {passwordLoading ? 'Updating...' : 'Update Password'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Delete Account Section */}
                <div className="mt-8 pt-6 border-t border-red-300 bg-red-50 p-4 rounded-md">
                    <h3 className="text-md font-semibold text-red-800 flex items-center gap-2">
                        <ShieldAlert size={18} /> Danger Zone
                    </h3>
                    <p className="mt-2 text-sm text-red-700">
                        Deleting your account is permanent and cannot be undone. All your personal data, expenses, budgets, categories, and household information will be removed.
                    </p>
                    <button
                        onClick={openDeleteModal}
                        className="mt-4 inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                        disabled={deleteLoading || passwordLoading} // Disable if any action is loading
                    >
                        <Trash2 size={16} className="mr-2" />
                        Delete My Account
                    </button>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 transition-opacity duration-300"
                    aria-labelledby="modal-title" role="dialog" aria-modal="true"
                    onClick={closeDeleteModal} // Close on overlay click
                >
                    <div
                        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4 relative transform transition-all duration-300 scale-100"
                        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
                    >
                        <h2 id="modal-title" className="text-lg font-bold text-red-800 mb-3 flex items-center gap-2">
                           <ShieldAlert size={20} /> Are you absolutely sure?
                        </h2>
                        <p className="text-sm text-gray-600 mb-4">
                            This action is irreversible. To confirm deletion, please type your email address (<strong className="font-medium">{currentUserEmail || 'your email'}</strong>) in the box below.
                        </p>

                        <div className="mb-4">
                            <label htmlFor="delete-confirm-email" className="sr-only">Confirm Email</label>
                            <input
                                id="delete-confirm-email"
                                type="email"
                                value={deleteConfirmEmail}
                                onChange={(e) => setDeleteConfirmEmail(e.target.value)}
                                placeholder="Type your email to confirm"
                                className={`w-full px-3 py-2 border rounded-md shadow-sm text-sm ${deleteError ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'} focus:outline-none`}
                                disabled={deleteLoading}
                            />
                            {deleteError && (
                                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                                    <AlertTriangle size={14} /> {deleteError}
                                </p>
                            )}
                        </div>

                        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={closeDeleteModal}
                                disabled={deleteLoading}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteAccount}
                                disabled={deleteLoading || deleteConfirmEmail.toLowerCase() !== currentUserEmail?.toLowerCase()}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[180px]"
                            >
                                {deleteLoading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Trash2 size={16} className="mr-2" />}
                                {deleteLoading ? 'Deleting Account...' : 'Delete Account Permanently'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
