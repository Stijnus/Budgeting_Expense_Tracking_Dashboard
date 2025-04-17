// src/components/HouseholdManager.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Database } from '../lib/database.types';
import { Loader2, AlertTriangle, Users, PlusCircle, Home, LogOut, Trash2, UserPlus, Check, X, Send, UserCog, ArrowUpCircle, ArrowDownCircle } from 'lucide-react'; // Added icons

type Household = Database['public']['Tables']['households']['Row'];
type HouseholdMember = Database['public']['Tables']['household_members']['Row'] & {
    users?: { id: string, email: string | null } | null; // Include user ID in join
};
type User = { id: string, email: string | null }; // Simple user type
type Role = 'owner' | 'admin' | 'member'; // Define Role type

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
    const [isUpdatingRole, setIsUpdatingRole] = useState<{ [key: string]: boolean }>({}); // Loading state for role updates { householdId_userId: boolean }
    const [newHouseholdName, setNewHouseholdName] = useState('');
    const [userId, setUserId] = useState<string | null>(null);
    const [userRoles, setUserRoles] = useState<{ [householdId: string]: Role }>({}); // Store current user's role per household
    const [showAddMemberInput, setShowAddMemberInput] = useState<string | null>(null); // ID of household to show input for
    const [addMemberEmail, setAddMemberEmail] = useState('');

    // Fetch user ID first
    useEffect(() => {
        const getUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                console.log("HouseholdManager: User ID found:", session.user.id);
                setUserId(session.user.id);
            } else {
                console.error("HouseholdManager: User not authenticated.");
                setError("User not authenticated.");
                setLoading(false);
            }
        };
        getUser();
    }, []);

    // Fetch household data once user ID is available
    const fetchHouseholds = useCallback(async (showLoadingIndicator = true) => {
        if (!userId) {
             console.log("HouseholdManager: Skipping fetch, no userId yet.");
             return;
        }
        console.log("HouseholdManager: Fetching households for user:", userId);

        if (showLoadingIndicator) setLoading(true);
        setError(null);
        setMemberError({});
        try {
            // Fetch household IDs and the user's role in each
            const { data: memberEntries, error: memberError } = await supabase
                .from('household_members')
                .select('household_id, role') // Select role as well
                .eq('user_id', userId);

            if (memberError) throw memberError;
            if (!memberEntries || memberEntries.length === 0) {
                console.log("HouseholdManager: User is not a member of any households.");
                setHouseholds([]);
                setUserRoles({});
                if (showLoadingIndicator) setLoading(false);
                return;
            }

            const householdIds = memberEntries.map(m => m.household_id);
            const rolesMap: { [householdId: string]: Role } = {};
            memberEntries.forEach(m => { rolesMap[m.household_id] = m.role as Role; });
            setUserRoles(rolesMap); // Store user's roles
            console.log("HouseholdManager: User roles:", rolesMap);

            // Fetch households with members and user details
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
            console.log("HouseholdManager: Fetched households data:", householdsData);

            const householdsWithMembers = householdsData?.map(h => ({
                ...h,
                members: h.household_members.map(m => ({
                    ...m,
                    users: m.users ?? { id: m.user_id, email: 'Unknown/Deleted User' }
                })) as HouseholdMember[]
            })) || [];

            setHouseholds(householdsWithMembers);

        } catch (err: any) {
            console.error('Error fetching households:', err);
            setError(`Failed to load households: ${err.message}`);
            setHouseholds([]);
            setUserRoles({});
        } finally {
            if (showLoadingIndicator) setLoading(false);
        }
    }, [userId]);

    // Trigger fetch when userId changes
    useEffect(() => {
        if (userId) {
            fetchHouseholds(true);
        }
    }, [userId, fetchHouseholds]);

    // --- Create, Delete, Leave Household (remain mostly the same) ---
    const handleCreateHousehold = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        console.log("HouseholdManager: Attempting to create household...");
        if (!newHouseholdName.trim() || !userId) {
            const errorMsg = !userId ? "User session error. Please refresh." : "Household name cannot be empty.";
            console.error("HouseholdManager: Create validation failed:", errorMsg);
            setFormError(errorMsg);
            return;
        }
        setIsCreating(true); setFormError(null); setError(null);
        let newHouseholdId: string | null = null;
        try {
            const householdInsertData = { name: newHouseholdName.trim(), owner_id: userId };
            console.log("HouseholdManager: Inserting household with data:", householdInsertData);
            const { data: newHousehold, error: createError } = await supabase
                .from('households')
                .insert(householdInsertData)
                .select('id').single();

            if (createError) {
                console.error("HouseholdManager: Error inserting household:", createError);
                if (createError.message.includes('RLS')) {
                     throw new Error(`Household insert failed due to RLS. Check policy 'Allow household insert for owner'. Details: ${createError.message}`);
                }
                throw createError;
            }
            if (!newHousehold?.id) {
                 console.error("HouseholdManager: Household insert returned no ID.");
                 throw new Error("Failed to create household record (no ID returned).");
            }
            newHouseholdId = newHousehold.id;
            console.log("HouseholdManager: Household created successfully with ID:", newHouseholdId);

            const memberInsertData = { household_id: newHouseholdId, user_id: userId, role: 'owner' };
            console.log("HouseholdManager: Inserting owner member with data:", memberInsertData);
            const { error: memberError } = await supabase
                .from('household_members')
                .insert(memberInsertData);

            if (memberError) {
                console.error("HouseholdManager: Error inserting owner member:", memberError);
                 if (memberError.message.includes('RLS')) {
                     throw new Error(`Owner member insert failed due to RLS. Check policy 'Allow owner or admin to insert members'. Details: ${memberError.message}`);
                 }
                console.warn("HouseholdManager: Failed to add owner member, attempting to delete household...");
                await supabase.from('households').delete().eq('id', newHouseholdId);
                console.log("HouseholdManager: Cleanup successful, household deleted:", newHouseholdId);
                throw memberError;
            }
            console.log("HouseholdManager: Owner member added successfully.");
            setNewHouseholdName('');
            fetchHouseholds(false);
        } catch (err: any) {
            console.error("Error during household creation process:", err);
            const errorMessage = err?.message || 'An unknown error occurred';
            if (errorMessage.includes('RLS')) { setFormError(errorMessage); }
            else { setFormError(`Failed to create household: ${errorMessage}`); }
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteHousehold = async (householdId: string, ownerId: string) => {
        if (!userId || userId !== ownerId) { alert("Only the owner can delete the household."); return; }
        if (!window.confirm('Are you sure? This deletes the household and removes all members.')) return;
        setLoading(true); setError(null);
        try {
            console.log(`HouseholdManager: Attempting to delete household ${householdId} by owner ${userId}`);
            const { error } = await supabase.from('households').delete().eq('id', householdId);
            if (error) {
                 console.error("HouseholdManager: Error deleting household:", error);
                 if (error.message.includes('RLS')) {
                     throw new Error(`Household delete failed due to RLS. Check policy 'Allow household delete for owner'. Details: ${error.message}`);
                 }
                 throw error;
            }
            console.log(`HouseholdManager: Household ${householdId} deleted successfully.`);
            fetchHouseholds(false);
        } catch (err: any) {
            console.error("Error deleting household:", err);
            setError(`Failed to delete household: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleLeaveHousehold = async (householdId: string, role: Role) => {
        if (role === 'owner') { alert("Owners cannot leave. Delete the household or transfer ownership (not implemented)."); return; }
        if (!userId || !window.confirm('Are you sure you want to leave this household?')) return;
        setLoading(true); setError(null);
        try {
            console.log(`HouseholdManager: User ${userId} attempting to leave household ${householdId}`);
            const { error } = await supabase.from('household_members').delete().eq('household_id', householdId).eq('user_id', userId);
            if (error) {
                console.error("HouseholdManager: Error leaving household:", error);
                if (error.message.includes('RLS')) {
                     throw new Error(`Leave household failed due to RLS. Check policy 'Allow member delete for self, owner, or admin'. Details: ${error.message}`);
                 }
                throw error;
            }
             console.log(`HouseholdManager: User ${userId} left household ${householdId} successfully.`);
            fetchHouseholds(false);
        } catch (err: any) {
            console.error("Error leaving household:", err);
            setError(`Failed to leave household: ${err.message}`);
        } finally {
             setLoading(false);
        }
    };

    // --- Member Management (Add, Remove, Promote/Demote) ---
    const handleShowAddInput = (householdId: string) => { setShowAddMemberInput(householdId); setAddMemberEmail(''); setMemberError(prev => ({ ...prev, [householdId]: null })); };
    const handleCancelAddMember = () => { setShowAddMemberInput(null); setAddMemberEmail(''); };

    const handleAddMemberSubmit = async (event: React.FormEvent<HTMLFormElement>, householdId: string) => {
        event.preventDefault();
        const emailToAdd = addMemberEmail.trim().toLowerCase();
        console.log(`HouseholdManager: Attempting to add member ${emailToAdd} to household ${householdId}`);
        if (!emailToAdd) { setMemberError(prev => ({ ...prev, [householdId]: "Email cannot be empty." })); return; }
        if (!userId) { setMemberError(prev => ({ ...prev, [householdId]: "Current user session error." })); return; }

        setIsAddingMember(prev => ({ ...prev, [householdId]: true }));
        setMemberError(prev => ({ ...prev, [householdId]: null }));
        try {
            let userToAdd: User | null = null;
            console.log(`HouseholdManager: Calling RPC get_user_id_by_email for ${emailToAdd}`);
            const { data: rpcData, error: rpcError } = await supabase.rpc('get_user_id_by_email', { user_email: emailToAdd });
             if (rpcError || !rpcData) {
                 console.error("HouseholdManager: RPC Error or user not found:", rpcError);
                 throw new Error(`User with email ${emailToAdd} not found or RPC error.`);
             }
             userToAdd = { id: rpcData, email: emailToAdd };
             console.log(`HouseholdManager: RPC successful, found user ID: ${userToAdd.id} for ${emailToAdd}`);

            const household = households.find(h => h.id === householdId);
            const isAlreadyMember = household?.members.some(m => m.user_id === userToAdd?.id);
            if (isAlreadyMember) { throw new Error(`${emailToAdd} is already a member of this household.`); }

            const memberInsertData = { household_id: householdId, user_id: userToAdd.id, role: 'member' }; // Always add as 'member' initially
            console.log(`HouseholdManager: Inserting new member link with data:`, memberInsertData);
            const { error: insertError } = await supabase.from('household_members').insert(memberInsertData);
            if (insertError) {
                 console.error("HouseholdManager: Error inserting member link:", insertError);
                 if (insertError.message.includes('RLS')) {
                     throw new Error(`Add member failed due to RLS. Check policy 'Allow owner or admin to insert members'. Details: ${insertError.message}`);
                 }
                 if (insertError.code === '23505') { throw new Error(`${emailToAdd} is already a member.`); }
                 throw insertError;
            }
            console.log(`HouseholdManager: Successfully added ${emailToAdd} to household ${householdId}`);
            setAddMemberEmail(''); setShowAddMemberInput(null); fetchHouseholds(false);
        } catch (err: any) {
            console.error("Error adding member:", err);
            setMemberError(prev => ({ ...prev, [householdId]: `Failed: ${err.message}` }));
        } finally {
            setIsAddingMember(prev => ({ ...prev, [householdId]: false }));
        }
    };

    const handleRemoveMember = async (householdId: string, memberUserId: string, ownerId: string) => {
        const currentUserRole = userRoles[householdId];
        if (!userId || (currentUserRole !== 'owner' && currentUserRole !== 'admin')) { alert("Only owners or admins can remove members."); return; }
        if (memberUserId === ownerId) { alert("Owner cannot be removed."); return; }
        if (!window.confirm('Are you sure you want to remove this member?')) return;

        setMemberError(prev => ({ ...prev, [householdId]: null }));
        try {
            console.log(`HouseholdManager: User ${userId} (Role: ${currentUserRole}) attempting to remove member ${memberUserId} from household ${householdId}`);
            const { error } = await supabase.from('household_members').delete()
                .eq('household_id', householdId)
                .eq('user_id', memberUserId);
            if (error) {
                console.error("HouseholdManager: Error removing member:", error);
                 if (error.message.includes('RLS')) {
                     throw new Error(`Remove member failed due to RLS. Check policy 'Allow member delete for self, owner, or admin'. Details: ${error.message}`);
                 }
                throw error;
            }
            console.log(`HouseholdManager: Member ${memberUserId} removed from household ${householdId} successfully.`);
            fetchHouseholds(false);
        } catch (err: any) {
            console.error("Error removing member:", err);
            setMemberError(prev => ({ ...prev, [householdId]: `Remove failed: ${err.message}` }));
        }
    };

    const handleUpdateRole = async (householdId: string, memberUserId: string, newRole: 'admin' | 'member') => {
        const loadingKey = `${householdId}_${memberUserId}`;
        setIsUpdatingRole(prev => ({ ...prev, [loadingKey]: true }));
        setMemberError(prev => ({ ...prev, [householdId]: null }));

        try {
            console.log(`HouseholdManager: Attempting to change role of ${memberUserId} to ${newRole} in household ${householdId}`);
            const { error } = await supabase
                .from('household_members')
                .update({ role: newRole })
                .eq('household_id', householdId)
                .eq('user_id', memberUserId);

            if (error) {
                 console.error("HouseholdManager: Error updating role:", error);
                 if (error.message.includes('RLS')) {
                     throw new Error(`Role update failed due to RLS. Check policy 'Allow owner or admin to update member roles'. Details: ${error.message}`);
                 }
                 throw error;
            }
            console.log(`HouseholdManager: Role for ${memberUserId} updated to ${newRole} successfully.`);
            fetchHouseholds(false); // Refresh list to show new role

        } catch (err: any) {
             console.error("Error updating role:", err);
             setMemberError(prev => ({ ...prev, [householdId]: `Role update failed: ${err.message}` }));
        } finally {
             setIsUpdatingRole(prev => ({ ...prev, [loadingKey]: false }));
        }
    };


    // --- Render ---
    return (
        <div className="p-4 bg-white rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
                <Users size={20} className="text-gray-600" /> Households
            </h2>

            {/* Create Household Form */}
            <form onSubmit={handleCreateHousehold} className="mb-6 p-4 border border-gray-200 rounded-md bg-gray-50 space-y-3">
                {/* ... (form content remains the same) ... */}
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
                            const currentUserRole = userRoles[h.id]; // Get current user's role in this household
                            const isOwner = h.owner_id === userId; // Check if current user is the owner
                            const isAdmin = currentUserRole === 'admin'; // Check if current user is an admin
                            const canManageMembers = isOwner || isAdmin; // Owner or Admin can manage
                            const householdMemberError = memberError[h.id];
                            const addingThisMember = isAddingMember[h.id];

                            return (
                                <li key={h.id} className="p-4 rounded-md border border-gray-200 bg-gray-50 space-y-3">
                                    {/* Household Header */}
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                                        <h4 className="text-lg font-semibold text-gray-800">{h.name}</h4>
                                        <div className="flex items-center space-x-2 mt-2 sm:mt-0 flex-shrink-0">
                                            {isOwner && (<button onClick={() => handleDeleteHousehold(h.id, h.owner_id)} disabled={loading || isCreating} className="p-1 text-red-600 hover:text-red-800 rounded hover:bg-red-100 disabled:opacity-50 focus:outline-none focus:ring-1 focus:ring-red-400" title="Delete Household"><Trash2 size={16} /></button>)}
                                            {!isOwner && (<button onClick={() => handleLeaveHousehold(h.id, currentUserRole)} disabled={loading || isCreating} className="p-1 text-orange-600 hover:text-orange-800 rounded hover:bg-orange-100 disabled:opacity-50 focus:outline-none focus:ring-1 focus:ring-orange-400" title="Leave Household"><LogOut size={16} /></button>)}
                                        </div>
                                    </div>

                                    {/* Member Section */}
                                    <div>
                                        <h5 className="text-sm font-medium text-gray-600 mb-2">Members ({h.members.length})</h5>
                                        {/* Member List */}
                                        <ul className="space-y-1 text-sm max-h-48 overflow-y-auto pr-1 mb-3"> {/* Increased max height */}
                                            {h.members.map(member => {
                                                const memberIsOwner = member.user_id === h.owner_id;
                                                const memberIsSelf = member.user_id === userId;
                                                const roleUpdateLoadingKey = `${h.id}_${member.user_id}`;
                                                const isRoleUpdating = isUpdatingRole[roleUpdateLoadingKey];

                                                return (
                                                    <li key={member.user_id} className="flex justify-between items-center p-1.5 bg-white rounded border border-gray-100 gap-2">
                                                        {/* Left side: Email and Role */}
                                                        <span className="truncate flex-grow" title={member.users?.email || 'Loading email...'}>
                                                            {member.users?.email || <Loader2 size={12} className="inline animate-spin" />}
                                                            {member.role === 'owner' && <span className="ml-1.5 text-xs font-semibold text-indigo-600">(Owner)</span>}
                                                            {member.role === 'admin' && <span className="ml-1.5 text-xs font-semibold text-purple-600">(Admin)</span>}
                                                            {memberIsSelf && <span className="ml-1.5 text-xs font-semibold text-green-600">(You)</span>}
                                                        </span>
                                                        {/* Right side: Actions (Remove, Promote/Demote) */}
                                                        <div className="flex items-center space-x-1 flex-shrink-0">
                                                            {/* Role Update Buttons (visible to owner/admin, not for owner or self) */}
                                                            {canManageMembers && !memberIsOwner && !memberIsSelf && (
                                                                <>
                                                                    {member.role === 'member' && (
                                                                        <button
                                                                            onClick={() => handleUpdateRole(h.id, member.user_id, 'admin')}
                                                                            disabled={loading || isCreating || addingThisMember || isRoleUpdating}
                                                                            className="p-0.5 text-purple-500 hover:text-purple-700 rounded hover:bg-purple-100 disabled:opacity-50 focus:outline-none focus:ring-1 focus:ring-purple-300"
                                                                            title="Promote to Admin"
                                                                        >
                                                                            {isRoleUpdating ? <Loader2 size={14} className="animate-spin"/> : <ArrowUpCircle size={14} />}
                                                                        </button>
                                                                    )}
                                                                    {member.role === 'admin' && (
                                                                        <button
                                                                            onClick={() => handleUpdateRole(h.id, member.user_id, 'member')}
                                                                            disabled={loading || isCreating || addingThisMember || isRoleUpdating}
                                                                            className="p-0.5 text-yellow-600 hover:text-yellow-800 rounded hover:bg-yellow-100 disabled:opacity-50 focus:outline-none focus:ring-1 focus:ring-yellow-400"
                                                                            title="Demote to Member"
                                                                        >
                                                                             {isRoleUpdating ? <Loader2 size={14} className="animate-spin"/> : <ArrowDownCircle size={14} />}
                                                                        </button>
                                                                    )}
                                                                </>
                                                            )}
                                                            {/* Remove Button (visible to owner/admin, not for owner) */}
                                                            {canManageMembers && !memberIsOwner && (
                                                                <button
                                                                    onClick={() => handleRemoveMember(h.id, member.user_id, h.owner_id)}
                                                                    disabled={loading || isCreating || addingThisMember || isRoleUpdating}
                                                                    className="p-0.5 text-red-500 hover:text-red-700 rounded hover:bg-red-100 disabled:opacity-50 focus:outline-none focus:ring-1 focus:ring-red-300"
                                                                    title="Remove Member"
                                                                >
                                                                    <X size={14} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </li>
                                                );
                                            })}
                                        </ul>

                                        {/* Add Member Area (Owner or Admin Only) */}
                                        {canManageMembers && (
                                            <div className="mt-3 pt-3 border-t border-gray-200">
                                                {showAddMemberInput === h.id ? (
                                                    <form onSubmit={(e) => handleAddMemberSubmit(e, h.id)} className="space-y-2">
                                                        {/* ... (input form remains the same) ... */}
                                                        <label htmlFor={`add-email-${h.id}`} className="sr-only">Member Email</label>
                                                        <input id={`add-email-${h.id}`} type="email" placeholder="Enter member's email address" value={addMemberEmail} onChange={(e) => setAddMemberEmail(e.target.value)} disabled={addingThisMember} required className="block w-full px-3 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"/>
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
                                        {canManageMembers && householdMemberError && showAddMemberInput !== h.id && (
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
