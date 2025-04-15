import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { Database } from '../lib/database.types'
import { Trash2, Pencil, Save, XCircle, Loader2, AlertTriangle, ListPlus } from 'lucide-react'; // Import icons

type Category = Database['public']['Tables']['categories']['Row']

export default function Categories() {
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<Category[]>([])
  const [newCategoryName, setNewCategoryName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [updating, setUpdating] = useState(false);

  const editInputRef = useRef<HTMLInputElement>(null);
  const addInputRef = useRef<HTMLInputElement>(null); // Ref for add input

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    if (editingCategoryId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingCategoryId]);

  const fetchCategories = async () => {
    setLoading(true); // Set loading true at the start of fetch
    setError(null)
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) throw sessionError
      if (!session?.user) throw new Error('User not logged in')

      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', session.user.id)
        .order('name', { ascending: true }) // Sort alphabetically by default

      if (error) throw error
      if (data) setCategories(data)

    } catch (error: any) {
      console.error('Error fetching categories:', error)
      setError(`Failed to load categories: ${error.message}`)
      setCategories([]); // Clear categories on error
    } finally {
      setLoading(false)
    }
  }

  const handleAddCategory = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmedName = newCategoryName.trim();
    if (!trimmedName) {
      setError("Category name cannot be empty.")
      addInputRef.current?.focus();
      return
    }
    setAdding(true)
    setError(null)

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) throw userError || new Error('User not found')

      // Check if category already exists (case-insensitive)
      const { data: existing, error: checkError } = await supabase
        .from('categories')
        .select('id')
        .eq('user_id', user.id)
        .ilike('name', trimmedName) // Case-insensitive check
        .maybeSingle(); // Returns one or null

      if (checkError) throw checkError;
      if (existing) throw new Error(`Category "${trimmedName}" already exists.`);


      const { data, error } = await supabase
        .from('categories')
        .insert({ name: trimmedName, user_id: user.id })
        .select()
        .single()

      if (error) throw error; // Let the generic handler catch specific DB errors

      if (data) {
        // Insert into sorted list
        setCategories(prevCategories => [...prevCategories, data].sort((a, b) => a.name.localeCompare(b.name)));
        setNewCategoryName('')
        addInputRef.current?.focus(); // Keep focus on add input
      }
    } catch (error: any) {
      console.error('Error adding category:', error)
      setError(`Failed to add category: ${error.message}`)
      addInputRef.current?.focus(); // Refocus on error
    } finally {
      setAdding(false)
    }
  }

  const handleDeleteCategory = async (categoryId: string) => {
    if (!window.confirm('Are you sure you want to delete this category? Expenses using it will become uncategorized.')) {
      return;
    }
    setDeletingId(categoryId);
    setError(null);
    try {
      // Check if any expenses use this category
       const { count, error: countError } = await supabase
        .from('expenses')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', categoryId);

       if (countError) throw countError;

       if (count && count > 0) {
           if (!window.confirm(`This category is used by ${count} expense(s). Deleting it will make them uncategorized. Continue?`)) {
               setDeletingId(null);
               return;
           }
       }


      const { error: deleteError } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);
      if (deleteError) throw deleteError;
      // Remove from local state immediately for better UX
      setCategories(prev => prev.filter(cat => cat.id !== categoryId));
      // fetchCategories(); // Optionally refetch instead of local update
    } catch (error: any) {
      console.error('Error deleting category:', error);
      setError(`Failed to delete category: ${error.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditClick = (category: Category) => {
    setEditingCategoryId(category.id);
    setEditingCategoryName(category.name);
    setError(null);
  };

  const handleCancelEdit = () => {
    setEditingCategoryId(null);
    setEditingCategoryName('');
    setError(null);
  };

  const handleUpdateCategory = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = editingCategoryName.trim();
    if (!trimmedName) {
      setError("Category name cannot be empty.");
      editInputRef.current?.focus();
      return;
    }
    if (!editingCategoryId) return;

    const originalCategory = categories.find(cat => cat.id === editingCategoryId);
    if (originalCategory?.name === trimmedName) {
      handleCancelEdit();
      return;
    }

    setUpdating(true);
    setError(null);

    try {
       const { data: { user }, error: userError } = await supabase.auth.getUser()
       if (userError || !user) throw userError || new Error('User not found')

       // Check if category already exists (case-insensitive, excluding self)
       const { data: existing, error: checkError } = await supabase
         .from('categories')
         .select('id')
         .eq('user_id', user.id)
         .ilike('name', trimmedName)
         .neq('id', editingCategoryId) // Exclude the category being edited
         .maybeSingle();

       if (checkError) throw checkError;
       if (existing) throw new Error(`Category "${trimmedName}" already exists.`);


      const { error } = await supabase
        .from('categories')
        .update({ name: trimmedName })
        .eq('id', editingCategoryId);

      if (error) throw error;

      // Update local state and re-sort
      setCategories(prevCategories =>
        prevCategories.map(cat =>
          cat.id === editingCategoryId ? { ...cat, name: trimmedName } : cat
        ).sort((a, b) => a.name.localeCompare(b.name))
      );
      handleCancelEdit();

    } catch (error: any) {
      console.error('Error updating category:', error);
      setError(`Failed to update category: ${error.message}`);
      editInputRef.current?.focus(); // Refocus on error
    } finally {
      setUpdating(false);
    }
  };


  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Spending Categories</h2>

      {/* Add Category Form */}
      <form onSubmit={handleAddCategory} className="mb-6 flex space-x-2">
        <input
          ref={addInputRef}
          type="text"
          placeholder="New category name"
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          disabled={adding || loading || !!editingCategoryId}
          className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 text-sm"
          maxLength={100}
        />
        <button
          type="submit"
          disabled={adding || loading || !newCategoryName.trim() || !!editingCategoryId}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 flex items-center justify-center"
        >
          {adding ? <Loader2 className="animate-spin h-4 w-4" /> : 'Add'}
        </button>
      </form>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-md text-sm flex items-center gap-2">
            <AlertTriangle size={16} />
            <span>{error}</span>
        </div>
      )}

      {/* Category List Area */}
      <div className="min-h-[150px]"> {/* Give minimum height to avoid layout shifts */}
        {loading ? (
          <div className="flex items-center justify-center py-10 text-gray-500">
            <Loader2 className="animate-spin h-6 w-6 mr-3" />
            Loading categories...
          </div>
        ) : categories.length === 0 && !error ? (
          // Empty State
          <div className="text-center py-6 px-4">
             <ListPlus className="mx-auto h-10 w-10 text-gray-400" />
             <h3 className="mt-2 text-sm font-medium text-gray-900">No Categories Yet</h3>
             <p className="mt-1 text-sm text-gray-500">Add your first spending category above.</p>
          </div>
        ) : categories.length > 0 ? (
          // Category List
          <ul className="space-y-2 max-h-96 overflow-y-auto pr-1"> {/* Max height and scroll */}
            {categories.map((category) => (
              <li
                key={category.id}
                className={`p-2.5 bg-gray-50 rounded-md border border-gray-200 flex justify-between items-center transition-opacity duration-300 ${deletingId === category.id || (updating && editingCategoryId === category.id) ? 'opacity-50' : ''} ${editingCategoryId === category.id ? 'ring-2 ring-indigo-300 ring-offset-1' : ''}`}
              >
                {editingCategoryId === category.id ? (
                  // Edit Mode
                  <form onSubmit={handleUpdateCategory} className="flex-grow flex items-center space-x-2 mr-1">
                     <input
                        ref={editInputRef}
                        type="text"
                        value={editingCategoryName}
                        onChange={(e) => setEditingCategoryName(e.target.value)}
                        disabled={updating}
                        className="flex-grow px-2 py-1 border border-indigo-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        maxLength={100}
                      />
                      <button
                        type="submit"
                        disabled={updating || !editingCategoryName.trim() || editingCategoryName === category.name}
                        className="p-1 text-green-600 hover:text-green-800 rounded hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-green-400"
                        title="Save Changes"
                      >
                        {updating ? <Loader2 className="animate-spin h-4 w-4" /> : <Save size={16} />}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        disabled={updating}
                        className="p-1 text-gray-500 hover:text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 focus:outline-none focus:ring-1 focus:ring-gray-400"
                        title="Cancel Edit"
                      >
                        <XCircle size={16} />
                      </button>
                  </form>
                ) : (
                  // View Mode
                  <>
                    <span className="text-sm text-gray-800 flex-grow mr-2 truncate" title={category.name}>{category.name}</span>
                    <div className="flex items-center space-x-1 flex-shrink-0">
                      {/* <span className="text-xs text-gray-400 hidden sm:inline">
                        {new Date(category.created_at).toLocaleDateString()}
                      </span> */}
                      <button
                        onClick={() => handleEditClick(category)}
                        disabled={deletingId === category.id || !!editingCategoryId || loading}
                        className="p-1 text-blue-600 hover:text-blue-800 rounded hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-blue-400"
                        title="Edit Category"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category.id)}
                        disabled={deletingId === category.id || !!editingCategoryId || loading}
                        className="p-1 text-red-600 hover:text-red-800 rounded hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-red-400"
                        title="Delete Category"
                      >
                         {deletingId === category.id ? (
                           <Loader2 className="animate-spin h-3.5 w-3.5" />
                         ) : (
                           <Trash2 size={14} />
                         )}
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        ) : null /* Covers the case where loading is false, error exists, but length is 0 */}
      </div>
    </div>
  )
}
