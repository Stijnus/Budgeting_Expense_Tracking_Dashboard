// src/features/expenses/components/EditExpenseModal.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../api/supabase/client';
import type { Database } from '../../../api/types/database.types';
import { X, Loader2, CheckCircle, AlertTriangle, Tag } from 'lucide-react'; // Icons

type Expense = Database['public']['Tables']['expenses']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];
type TagType = Database['public']['Tables']['tags']['Row']; // Use TagType alias
type ExpenseTag = Database['public']['Tables']['expense_tags']['Row'];

interface EditExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  expense: Expense | null;
  categories: Category[];
}

// Helper function to handle tag updates (add/remove links)
async function updateTags(userId: string, expenseId: string, newTagString: string): Promise<string[]> {
    const newTagNames = newTagString.split(',')
        .map(tag => tag.trim().toLowerCase())
        .filter(tag => tag.length > 0 && tag.length <= 50)
        .slice(0, 10);
    const uniqueNewTagNames = [...new Set(newTagNames)];
    const errors: string[] = [];

    // 1. Get current tags linked to the expense
    const { data: currentLinks, error: currentLinksError } = await supabase
        .from('expense_tags')
        .select('tag_id, tags ( id, name )') // Fetch tag name along with ID
        .eq('expense_id', expenseId);

    if (currentLinksError) {
        errors.push(`Error fetching current tags: ${currentLinksError.message}`);
        return errors; // Cannot proceed without knowing current state
    }

    const currentTagsMap = new Map<string, string>(); // Map tagId -> tagName
    currentLinks?.forEach(link => {
        if ((link as any).tags) { // Check if tags relation exists
             currentTagsMap.set(link.tag_id, (link as any).tags.name);
        }
    });
    const currentTagNames = Array.from(currentTagsMap.values());

    // 2. Determine tags to add and remove
    const tagsToAdd = uniqueNewTagNames.filter(name => !currentTagNames.includes(name));
    const tagsToRemove = Array.from(currentTagsMap.entries()) // Get [tagId, tagName] pairs
                           .filter(([_, name]) => !uniqueNewTagNames.includes(name))
                           .map(([tagId, _]) => tagId); // Get only the IDs of tags to remove

    // 3. Remove tags
    if (tagsToRemove.length > 0) {
        const { error: deleteError } = await supabase
            .from('expense_tags')
            .delete()
            .eq('expense_id', expenseId)
            .in('tag_id', tagsToRemove);
        if (deleteError) {
            errors.push(`Error removing tags: ${deleteError.message}`);
        }
    }

    // 4. Add new tags (find existing or create, then link)
    if (tagsToAdd.length > 0) {
        const tagPromises = tagsToAdd.map(async (name): Promise<TagType | null> => {
            let { data: existingTag, error: findError } = await supabase
                .from('tags')
                .select('id, name, user_id, created_at')
                .eq('user_id', userId)
                .ilike('name', name)
                .maybeSingle();

            if (findError) {
                errors.push(`Error finding tag "${name}": ${findError.message}`);
                return null;
            }

            if (existingTag) {
                return existingTag;
            } else {
                const { data: newTag, error: createError } = await supabase
                    .from('tags')
                    .insert({ user_id: userId, name: name })
                    .select('id, name, user_id, created_at')
                    .single();
                if (createError) {
                     if (createError.code === '23505') {
                         let { data: retryTag, error: retryError } = await supabase
                            .from('tags')
                            .select('id, name, user_id, created_at')
                            .eq('user_id', userId)
                            .ilike('name', name)
                            .maybeSingle();
                         if (retryError) errors.push(`Error retrying tag fetch "${name}": ${retryError.message}`);
                         else if (retryTag) return retryTag;
                         else errors.push(`Failed to create or find tag "${name}" after conflict.`);
                    } else {
                        errors.push(`Error creating tag "${name}": ${createError.message}`);
                    }
                    return null;
                }
                return newTag;
            }
        });

        const resolvedTags = (await Promise.all(tagPromises)).filter((tag): tag is TagType => tag !== null);

        if (resolvedTags.length > 0) {
            const links = resolvedTags.map(tag => ({
                expense_id: expenseId,
                tag_id: tag.id,
            }));
            const { error: linkError } = await supabase.from('expense_tags').insert(links);
            if (linkError && linkError.code !== '23505') { // Ignore primary key violation
                errors.push(`Error linking new tags: ${linkError.message}`);
            }
        }
    }

    return errors;
}


export default function EditExpenseModal({
  isOpen,
  onClose,
  onSave,
  expense,
  categories,
}: EditExpenseModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [fetchingTags, setFetchingTags] = useState(false);

  // Form state
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [tags, setTags] = useState(''); // Comma-separated string

  // Effect to populate form and fetch current tags when modal opens
  useEffect(() => {
    if (expense && isOpen) {
      setDescription(expense.description || '');
      setAmount(String(expense.amount));
      setExpenseDate(expense.expense_date ? new Date(expense.expense_date).toISOString().split('T')[0] : '');
      setSelectedCategoryId(expense.category_id);
      setError(null);
      setSuccessMessage(null);

      // Fetch current tags for this expense
      const fetchCurrentTags = async () => {
          setFetchingTags(true);
          setTags(''); // Reset tags initially
          try {
              const { data, error: tagsError } = await supabase
                  .from('expense_tags')
                  .select('tags ( name )') // Select the name from the related tags table
                  .eq('expense_id', expense.id);

              if (tagsError) throw tagsError;

              // Format fetched tags into a comma-separated string
              const tagNames = data?.map(item => (item as any).tags?.name).filter(Boolean) || [];
              setTags(tagNames.join(', '));

          } catch (err: any) {
              console.error("Error fetching tags for editing:", err);
              setError("Could not load current tags."); // Show error in modal
          } finally {
              setFetchingTags(false);
          }
      };
      fetchCurrentTags();

    }
    if (!isOpen) {
        setTags(''); // Clear tags when modal closes
    }
  }, [expense, isOpen]);


  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!expense) return;

    setError(null);
    setSuccessMessage(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid positive amount.');
      return;
    }
    if (!expenseDate) {
      setError('Please select a date.');
      return;
    }

    setLoading(true);

    try {
      // 1. Update Expense Data
      const updatedData = {
        amount: parsedAmount,
        description: description.trim(),
        expense_date: expenseDate,
        category_id: selectedCategoryId || null,
      };
      const { error: updateError } = await supabase
        .from('expenses')
        .update(updatedData)
        .eq('id', expense.id);
      if (updateError) throw updateError;

      // 2. Update Tags
      const { data: { user } } = await supabase.auth.getUser(); // Get user for tag handling
      if (!user) throw new Error("User not found for tag update.");
      const tagErrors = await updateTags(user.id, expense.id, tags);

      if (tagErrors.length > 0) {
          setError(`Expense updated, but failed to process some tags: ${tagErrors.join(', ')}`);
      } else {
          setSuccessMessage('Expense and tags updated successfully!');
      }

      onSave(); // Trigger refetch in parent

      setTimeout(() => {
        onClose(); // Close the modal after showing success/error
      }, 2000);

    } catch (error: any) {
      console.error('Error updating expense or tags:', error);
      setError(`Failed to update expense: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !expense) {
    return null;
  }

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      onClick={handleOverlayClick}
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div className={`bg-white rounded-lg shadow-xl p-6 w-full max-w-lg mx-4 relative transform transition-all duration-300 ${isOpen ? 'scale-100' : 'scale-95'}`}>
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 disabled:opacity-50"
          aria-label="Close modal"
        >
          <X size={24} />
        </button>

        <h2 id="modal-title" className="text-xl font-semibold mb-4 text-gray-800">Edit Expense</h2>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Description, Amount, Date, Category fields remain the same */}
          <div>
            <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <input
              type="text"
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              placeholder="e.g., Coffee, Lunch"
              maxLength={200}
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="edit-amount" className="block text-sm font-medium text-gray-700">
              Amount *
            </label>
            <input
              type="number"
              id="edit-amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              placeholder="0.00"
              step="0.01"
              min="0.01"
              required
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="edit-expenseDate" className="block text-sm font-medium text-gray-700">
              Date *
            </label>
            <input
              type="date"
              id="edit-expenseDate"
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              required
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="edit-category" className="block text-sm font-medium text-gray-700">
              Category
            </label>
            <select
              id="edit-category"
              value={selectedCategoryId ?? ''}
              onChange={(e) => setSelectedCategoryId(e.target.value || null)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm disabled:bg-gray-100"
              disabled={loading || categories.length === 0}
            >
              <option value="">-- Select Category (Optional) --</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
             {categories.length === 0 && !loading && (
               <p className="mt-1 text-xs text-gray-500">No categories available.</p>
             )}
          </div>

          {/* Tags Input */}
          <div>
            <label htmlFor="edit-tags" className="block text-sm font-medium text-gray-700">
              Tags <span className="text-xs text-gray-500">(comma-separated)</span>
            </label>
             <div className="relative mt-1">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Tag size={16} className="text-gray-400" />
                 </div>
                 <input
                    type="text"
                    id="edit-tags"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm disabled:bg-gray-100"
                    placeholder="e.g., work, travel, project-alpha"
                    disabled={loading || fetchingTags} // Disable while loading tags too
                    maxLength={200}
                 />
             </div>
             {fetchingTags && (
                 <p className="mt-1 text-xs text-gray-500 flex items-center"><Loader2 className="animate-spin h-3 w-3 mr-1" /> Loading tags...</p>
             )}
             <p className="mt-1 text-xs text-gray-500">Max 10 tags, 50 chars each. Lowercase, trimmed.</p>
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

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || fetchingTags} // Disable if loading expense or tags
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 flex items-center justify-center min-w-[110px]"
            >
              {loading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
