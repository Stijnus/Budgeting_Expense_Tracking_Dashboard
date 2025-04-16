// src/components/HouseholdManager.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Database } from '../lib/database.types';
import { Loader2, AlertTriangle, Users, PlusCircle, Home, LogOut, Trash2, UserPlus, Check, X, Send } from 'lucide-react';

type Household = Database['public']['Tables']['households']['Row'];
type HouseholdMember = Database['public']['Tables']['household_members']['Row'] & {
    users?: { id: string, email: string | null } | null; // Include user ID in join
};
type User = { id: string, email: string | null }; // Simple user type

// Combined type for easier state management
type HouseholdWithMembers = Household & { members: HouseholdMember[] };

export default function HouseholdManager() {
    const [households, setHouseholds] = useState<HouseholdWithMembers[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null); // For create form
    const [memberError, setMemberError] = useState<{ [key: string]: string | null }>({}); // Errors per household for member actions
    const [isCreating, setIsCreating] = useState(false); // For create form button
    const [isAddingMember, setIsAddingMember] = useState<{ [key: string]: boolean }>({}); // Loading state per household for adding member
    const [newHouseholdName, setNewHouseholdName] = useState('');
    const [userId, setUserId] = useState<string | null>(null);
    const [showAddMemberInput, setShowAddMemberInput] = useState<string | null>(null); // ID of household to show input for
    const [addMemberEmail, setAddMemberEmail] = useState('');

    // Fetch user ID first
    useEffect(() => {
        const getUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                console.log("HouseholdManager: User ID found:", session.user.id); // Debug log
                setUserId(session.user.id);
            } else {
                console.error("HouseholdManager: User not authenticated."); // Debug log
                setError("User not authenticated.");
                setLoading(false);
            }
        };
        getUser();
    }, []);

    // Fetch household data once user ID is available
    const fetchHouseholds = useCallback(async (showLoadingIndicator = true) => {
        if (!userId) {
             console.log("HouseholdManager: Skipping fetch, no userId yet."); // Debug log
             return;
        }
        console.log("HouseholdManager: Fetching households for user:", userId); // Debug log

        if (showLoadingIndicator) setLoading(true);
        setError(null); // Clear general error on refetch
        setMemberError({}); // Clear member-specific errors on refetch
        try {
            const { data: memberEntries, error: memberError } = await supabase
                .from('household_members')
                .select('household_id')
                .eq('user_id', userId);

            if (memberError) throw memberError;
            if (!memberEntries || memberEntries.length === 0) {
                console.log("HouseholdManager: User is not a member of any households."); // Debug log
                setHouseholds([]);
                if (showLoadingIndicator) setLoading(false);
                return;
            }

            const householdIds = memberEntries.map(m => m.household_id);
            console.log("HouseholdManager: User is member of household IDs:", householdIds); // Debug log

            // Fetch households with members and user details (id and email)
            const { data: householdsData, error: householdsError } = await supabase
                .from('households')
                .select(`
                    *,
                    household_members (
                        *,
                        users ( id, email )
                    )
                `)
                .in('id', householdIds)
                .order('created_at', { ascending: true });

            if (householdsError) throw householdsError;
            console.log("HouseholdManager: Fetched households data:", householdsData); // Debug log

            const householdsWithMembers = householdsData?.map(h => ({
                ...h,
                members: h.household_members.map(m => ({
                    ...m,
                    users: m.users ?? { id: 'unknown', email: 'Unknown User' } // Provide default user object
                })) as HouseholdMember[]
            })) || [];

            setHouseholds(householdsWithMembers);

        } catch (err: any) {
            console.error('Error fetching households:', err);
            setError(`Failed to load households: ${err.message}`);
            setHouseholds([]);
        } finally {
            if (showLoadingIndicator) setLoading(false);
        }
    }, [userId]);

    // Trigger fetch when userId changes
    useEffect(() => {
        if (userId) {
            fetchHouseholds(true); // Initial fetch shows main loader
        }
    }, [userId, fetchHouseholds]);

    const handleCreateHousehold = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        console.log("HouseholdManager: Attempting to create household..."); // Debug log
        if (!newHouseholdName.trim() || !userId) {
            const errorMsg = !userId ? "User session error. Please refresh." : "Household name cannot be empty.";
            console.error("HouseholdManager: Create validation failed:", errorMsg); // Debug log
            setFormError(errorMsg);
            return;
        }
        setIsCreating(true); setFormError(null); setError(null);
        try {
            console.log("HouseholdManager: Inserting household:", { name: newHouseholdName.trim(), owner_id: userId }); // Debug log
            const { data: newHousehold, error: createError } = await supabase
                .from('households')
                .insert({ name: newHouseholdName.trim(), owner_id: userId })
                .select().single();

            if (createError) {
                console.error("HouseholdManager: Error inserting household:", createError); // Debug log
                throw createError;
            }
            if (!newHousehold) {
                 console.error("HouseholdManager: Household insert returned no data."); // Debug log
                 throw new Error("Failed to create household record.");
            }
            console.log("HouseholdManager: Household created:", newHousehold); // Debug log

            console.log("HouseholdManager: Inserting owner member:", { household_id: newHousehold.id, user_id: userId, role: 'owner' }); // Debug log
            const { error: memberError } = await supabase
                .from('household_members')
                .insert({ household_id: newHousehold.id, user_id: userId, role: 'owner' });

            if (memberError) {
                console.error("HouseholdManager: Error inserting owner member:", memberError); // Debug log
                console.warn("HouseholdManager: Failed to add owner member, attempting to delete household...");
                // Attempt to clean up the created household if member insert fails
                await supabase.from('households').delete().eq('id', newHousehold.id);
                throw memberError;
            }
            console.log("HouseholdManager: Owner member added successfully."); // Debug log
            setNewHouseholdName('');
            fetchHouseholds(false); // Refetch without main loader
        } catch (err: any) {
            // --- MODIFICATION START ---
            console.error("Error creating household (full error object):", err); // Log the full error object
            const errorMessage = err?.message || 'An unknown error occurred'; // Provide a default message if err.message is missing
            setFormError(`Failed to create household: ${errorMessage}`);
            // --- MODIFICATION END ---
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteHousehold = async (householdId: string, ownerId: string) => {
        if (!userId || userId !== ownerId) { alert("Only the owner can delete the household."); return; }
        if (!window.confirm('Are you sure? This deletes the household and removes all members.')) return;
        setLoading(true); setError(null);
        try {
            // Note: RLS policies should handle cascading deletes or you might need to delete members first
            // depending on your foreign key setup. Assuming cascade or appropriate policies.
            const { error } = await supabase.from('households').delete().eq('id', householdId);
            if (error) throw error;
            fetchHouseholds(false); // Refetch list without main loader
        } catch (err: any) {
            console.error("Error deleting household:", err);
            setError(`Failed to delete household: ${err.message}`);
        } finally {
            setLoading(false); // Ensure loading is set to false in finally
        }
    };

    const handleLeaveHousehold = async (householdId: string, role: string) => {
        if (role === 'owner') { alert("Owners cannot leave. Delete the household or transfer ownership (not implemented)."); return; }
        if (!userId || !window.confirm('Are you sure you want to leave this household?')) return;
        setLoading(true); setError(null);
        try {
            const { error } = await supabase.from('household_members').delete().eq('household_id', householdId).eq('user_id', userId);
            if (error) throw error;
            fetchHouseholds(false);
        } catch (err: any) {
            console.error("Error leaving household:", err);
            setError(`Failed to leave household: ${err.message}`);
        } finally {
             setLoading(false); // Ensure loading is set to false in finally
        }
    };

    // --- Member Management ---
    const handleShowAddInput = (householdId: string) => {
        setShowAddMemberInput(householdId);
        setAddMemberEmail(''); // Clear email field when showing
        setMemberError(prev => ({ ...prev, [householdId]: null })); // Clear error for this household
    };

    const handleCancelAddMember = () => {
        setShowAddMemberInput(null);
        setAddMemberEmail('');
    };

    const handleAddMemberSubmit = async (event: React.FormEvent<HTMLFormElement>, householdId: string) => {
        event.preventDefault();
        const emailToAdd = addMemberEmail.trim().toLowerCase();
        console.log(`HouseholdManager: Attempting to add member ${emailToAdd} to household ${householdId}`); // Debug log
        if (!emailToAdd) {
            setMemberError(prev => ({ ...prev, [householdId]: "Email cannot be empty." }));
            return;
        }
        if (!userId) {
             setMemberError(prev => ({ ...prev, [householdId]: "Current user session error." }));
             return;
        }

        setIsAddingMember(prev => ({ ...prev, [householdId]: true }));
        setMemberError(prev => ({ ...prev, [householdId]: null }));

        try {
            // Use the RPC function to securely get the user ID from the email
            let userToAdd: User | null = null;
            console.log(`HouseholdManager: Calling RPC get_user_id_by_email for ${emailToAdd}`); // Debug log
            const { data: rpcData, error: rpcError } = await supabase.rpc('get_user_id_by_email', { user_email: emailToAdd });

             if (rpcError) {
                 console.error("HouseholdManager: RPC Error:", rpcError); // Debug log
                 // Handle specific RPC errors if needed
                 if (rpcError.code === 'PGRST116' || rpcError.message.includes('does not exist')) {
                     // Check if the function exists but returned null (user not found) vs function doesn't exist
                     const { data: checkData, error: checkError } = await supabase
                        .from('pg_proc') // Check system catalog for function existence
                        .select('proname')
                        .eq('proname', 'get_user_id_by_email')
                        .maybeSingle();

                     if (checkError || !checkData) {
                        console.error("HouseholdManager: Function 'get_user_id_by_email' not found in DB."); // Debug log
                        throw new Error(`Function 'get_user_id_by_email' not found in the database. Setup required.`);
                     } else {
                        // Function exists, but returned null or error during execution
                         console.warn(`HouseholdManager: RPC function exists but failed for ${emailToAdd}. User likely not found.`); // Debug log
                         throw new Error(`User with email ${emailToAdd} not found.`);
                     }

                 } else if (rpcError.message.includes('User not found')) { // Catch specific message if function raises it
                     throw new Error(`User with email ${emailToAdd} not found.`);
                 }
                 throw new Error(`Error finding user: ${rpcError.message}`); // Generic error for other RPC issues
             }

             // If RPC returned null/undefined explicitly (meaning user not found by the function)
             if (!rpcData) {
                 console.warn(`HouseholdManager: RPC returned null for ${emailToAdd}. User not found.`); // Debug log
                 throw new Error(`User with email ${emailToAdd} not found.`);
             }

             // If RPC succeeded and returned an ID
             userToAdd = { id: rpcData, email: emailToAdd }; // Assuming RPC returns just the ID
             console.log(`HouseholdManager: RPC successful, found user ID: ${userToAdd.id} for ${emailToAdd}`); // Debug log

            // 2. Check if user is already a member
            const household = households.find(h => h.id === householdId);
            const isAlreadyMember = household?.members.some(m => m.user_id === userToAdd?.id);
            if (isAlreadyMember) {
                console.warn(`HouseholdManager: User ${emailToAdd} is already a member.`); // Debug log
                throw new Error(`${emailToAdd} is already a member of this household.`);
            }

            // 3. Add the member
            console.log(`HouseholdManager: Inserting new member link:`, { household_id: householdId, user_id: userToAdd.id, role: 'member' }); // Debug log
            const { error: insertError } = await supabase
                .from('household_members')
                .insert({
                    household_id: householdId,
                    user_id: userToAdd.id,
                    role: 'member' // Default role
                });

            if (insertError) {
                 console.error("HouseholdManager: Error inserting member link:", insertError); // Debug log
                 if (insertError.code === '23503') { // Foreign key violation (user_id likely invalid)
                     throw new Error(`Failed to add member. User ID might be invalid.`);
                 }
                 if (insertError.code === '23505') { // Unique constraint violation (already exists)
                     throw new Error(`${emailToAdd} is already a member (concurrent add?).`);
                 }
                 throw insertError; // Throw other errors
            }
            console.log(`HouseholdManager: Successfully added ${emailToAdd} to household ${householdId}`); // Debug log

            // Success
            setAddMemberEmail('');
            setShowAddMemberInput(null);
            fetchHouseholds(false); // Refresh list without main loader

        } catch (err: any) {
            console.error("Error adding member:", err);
            setMemberError(prev => ({ ...prev, [householdId]: `Failed: ${err.message}` }));
        } finally {
            setIsAddingMember(prev => ({ ...prev, [householdId]: false }));
        }
    };


    const handleRemoveMember = async (householdId: string, memberUserId: string, ownerId: string) => {
        if (!userId || userId !== ownerId) { alert("Only the owner can remove members."); return; }
        if (memberUserId === ownerId) { alert("Owner cannot remove themselves."); return; }
        if (!window.confirm('Are you sure you want to remove this member?')) return;
        // Use local loading state for remove button if desired, or main loader
        // setLoading(true);
        setMemberError(prev => ({ ...prev, [householdId]: null })); // Clear error before trying
        try {
            const { error } = await supabase.from('household_members').delete().eq('household_id', householdId).eq('user_id', memberUserId);
            if (error) throw error;
            fetchHouseholds(false); // Refresh list
        } catch (err: any) {
            console.error("Error removing member:", err);
            setMemberError(prev => ({ ...prev, [householdId]: `Remove failed: ${err.message}` }));
            // setLoading(false);
        }
    };
    // --- End Member Management ---


    return (
        <div className="p-4 bg-white rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
                <Users size={20} className="text-gray-600" /> Households
            </h2>

            {/* Create Household Form */}
            <form onSubmit={handleCreateHousehold} className="mb-6 p-4 border border-gray-200 rounded-md bg-gray-50 space-y-3">
                <h3 className="text-md font-semibold text-gray-700">Create New Household</h3>
                <div>
                    <label htmlFor="household-name" className="sr-only">Household Name</label>
                    <input id="household-name" type="text" placeholder="Enter household name" value={newHouseholdName} onChange={(e) => setNewHouseholdName(e.target.value)} disabled={isCreating || loading} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm" maxLength={100} />
                </div>
                {formError && (<p className="text-sm text-red-600 flex items-center gap-1"><AlertTriangle size={16} /> {formError}</p>)}
                <button type="submit" disabled={isCreating || loading || !newHouseholdName.trim()} className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 flex items-center justify-center">
                    {isCreating ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <PlusCircle size={16} className="mr-2" />} {isCreating ? 'Creating...' : 'Create Household'}
                </button>
            </form>

            {/* General Error Display */}
            {error && (<div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-md text-sm flex items-center gap-2"><AlertTriangle size={16} /> {error}</div>)}

            {/* Households List */}
            <h3 className="text-lg font-semibold mb-3 text-gray-700 mt-6 pt-4 border-t">Your Households</h3>
            <div className="min-h-[100px]">
                {loading ? (
                    <div className="flex items-center justify-center py-6 text-gray-500"><Loader2 className="animate-spin h-6 w-6 mr-3" /> Loading households...</div>
                ) : households.length === 0 && !error ? (
                    <div className="text-center py-6 px-4 text-gray-500"><Home className="mx-auto h-10 w-10 text-gray-400" /><p className="mt-2 text-sm">You are not part of any household yet.</p><p className="text-xs">Create one above or ask someone to invite you.</p></div>
                ) : (
                    <ul className="space-y-4">
                        {households.map((h) => {
                            const currentUserMembership = h.members.find(m => m.user_id === userId);
                            const isOwner = h.owner_id === userId;
                            const userRole = currentUserMembership?.role || 'unknown';
                            const householdMemberError = memberError[h.id];
                            const addingThisMember = isAddingMember[h.id];

                            return (
                                <li key={h.id} className="p-4 rounded-md border border-gray-200 bg-gray-50 space-y-3">
                                    {/* Household Header */}
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                                        <h4 className="text-lg font-semibold text-gray-800">{h.name}</h4>
                                        <div className="flex items-center space-x-2 mt-2 sm:mt-0 flex-shrink-0">
                                            {isOwner && (<button onClick={() => handleDeleteHousehold(h.id, h.owner_id)} disabled={loading || isCreating} className="p-1 text-red-600 hover:text-red-800 rounded hover:bg-red-100 disabled:opacity-50 focus:outline-none focus:ring-1 focus:ring-red-400" title="Delete Household"><Trash2 size={16} /></button>)}
                                            {!isOwner && (<button onClick={() => handleLeaveHousehold(h.id, userRole)} disabled={loading || isCreating} className="p-1 text-orange-600 hover:text-orange-800 rounded hover:bg-orange-100 disabled:opacity-50 focus:outline-none focus:ring-1 focus:ring-orange-400" title="Leave Household"><LogOut size={16} /></button>)}
                                        </div>
                                    </div>

                                    {/* Member Section */}
                                    <div>
                                        <h5 className="text-sm font-medium text-gray-600 mb-2">Members ({h.members.length})</h5>
                                        {/* Member List */}
                                        <ul className="space-y-1 text-sm max-h-32 overflow-y-auto pr-1 mb-3">
                                            {h.members.map(member => (
                                                <li key={member.user_id} className="flex justify-between items-center p-1.5 bg-white rounded border border-gray-100">
                                                    <span className="truncate" title={member.users?.email || 'Loading email...'}>
                                                        {member.users?.email || <Loader2 size={12} className="inline animate-spin" />}
                                                        {member.role === 'owner' && <span className="ml-1.5 text-xs font-semibold text-indigo-600">(Owner)</span>}
                                                        {member.user_id === userId && <span className="ml-1.5 text-xs font-semibold text-green-600">(You)</span>}
                                                    </span>
                                                    {isOwner && member.user_id !== userId && (
                                                        <button onClick={() => handleRemoveMember(h.id, member.user_id, h.owner_id)} disabled={loading || isCreating || addingThisMember} className="p-0.5 text-red-500 hover:text-red-700 rounded hover:bg-red-100 disabled:opacity-50 focus:outline-none focus:ring-1 focus:ring-red-300 ml-2 flex-shrink-0" title="Remove Member"><X size={14} /></button>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>

                                        {/* Add Member Area (Owner Only) */}
                                        {isOwner && (
                                            <div className="mt-3 pt-3 border-t border-gray-200">
                                                {showAddMemberInput === h.id ? (
                                                    <form onSubmit={(e) => handleAddMemberSubmit(e, h.id)} className="space-y-2">
                                                        <label htmlFor={`add-email-${h.id}`} className="sr-only">Member Email</label>
                                                        <input
                                                            id={`add-email-${h.id}`}
                                                            type="email"
                                                            placeholder="Enter member's email address"
                                                            value={addMemberEmail}
                                                            onChange={(e) => setAddMemberEmail(e.target.value)}
                                                            disabled={addingThisMember}
                                                            required
                                                            className="block w-full px-3 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                                        />
                                                        {householdMemberError && (<p className="text-xs text-red-600 flex items-center gap-1"><AlertTriangle size={14} /> {householdMemberError}</p>)}
                                                        <div className="flex items-center justify-end space-x-2">
                                                            <button type="button" onClick={handleCancelAddMember} disabled={addingThisMember} className="px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 disabled:opacity-50">Cancel</button>
                                                            <button type="submit" disabled={addingThisMember || !addMemberEmail.trim()} className="px-2 py-1 text-xs font-medium text-white bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-green-500 disabled:opacity-50 flex items-center justify-center min-w-[60px]">
                                                                {addingThisMember ? <Loader2 className="animate-spin h-3 w-3 mr-1" /> : <Send size={12} className="mr-1" />} {addingThisMember ? 'Adding...' : 'Add'}
                                                            </button>
                                                        </div>
                                                    </form>
                                                ) : (
                                                    <button onClick={() => handleShowAddInput(h.id)} disabled={loading || isCreating || !!showAddMemberInput} className="px-2 py-1 text-xs font-medium text-white bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-green-500 disabled:opacity-50 flex items-center gap-1">
                                                        <UserPlus size={14} /> Add Member
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                        {/* Display member error even if input isn't shown */}
                                        {isOwner && householdMemberError && showAddMemberInput !== h.id && (
                                             <p className="text-xs text-red-600 mt-2 flex items-center gap-1"><AlertTriangle size={14} /> {householdMemberError}</p>
                                        )}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
}
